import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import fs from "fs";

dotenv.config();

const app = express();
app.use(express.json());

// Firebase initialization
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let db: any = null;

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log("[Firebase Server] Initialized Firestore database:", firebaseConfig.firestoreDatabaseId);
  } catch (err) {
    console.error("[Firebase Server Init Error]:", err);
  }
}

const PORT = 3000;

// Gemini AI Helper
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
  return new GoogleGenAI({ apiKey });
};

// Asaas API Helper
async function asaasRequest(method: string, path: string, body?: any) {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY is not configured.");

  const envUrl = process.env.ASAAS_API_URL;
  const baseUrl = envUrl 
    ? (envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl)
    : (!apiKey.includes("test") && process.env.ASAAS_SANDBOX !== "true" 
        ? "https://api.asaas.com/v3" 
        : "https://sandbox.asaas.com/v3");

  const url = `${baseUrl}${path}`;
  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json", "access_token": apiKey },
  };
  if (body) options.body = JSON.stringify(body);

  console.log(`[Asaas API] ${method} ${url}`);
  const response = await fetch(url, options);
  const text = await response.text();
  
  if (!response.ok) {
    let msg = "Asaas API Error";
    try { msg = JSON.parse(text).errors[0].description; } catch { msg = text; }
    throw new Error(msg);
  }
  return JSON.parse(text);
}

// --- API ROUTES ---

app.post("/api/chat-gemini", async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : {}
    });
    res.json({ text: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/asaas/assinar", async (req, res) => {
  try {
    const { clientName, email, cnpjCpf, paymentMethod, ownerId } = req.body;
    if (!ownerId || !clientName || !email) return res.status(400).json({ error: "Missing fields" });

    // 1. Customer
    let customerId = "";
    const cleanDoc = cnpjCpf?.replace(/\D/g, "");
    try {
      const search = await asaasRequest("GET", `/customers?email=${encodeURIComponent(email)}${cleanDoc ? `&cpfCnpj=${cleanDoc}` : ""}`);
      if (search.data?.[0]) customerId = search.data[0].id;
    } catch {}

    if (!customerId) {
      const customer = await asaasRequest("POST", "/customers", { name: clientName, email, cpfCnpj: cleanDoc });
      customerId = customer.id;
    }

    // 2. Subscription
    const billingType = paymentMethod === "Boleto" ? "BOLETO" : (paymentMethod === "Crédito" ? "CREDIT_CARD" : "PIX");
    const nextDueDate = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const subRes = await asaasRequest("POST", "/subscriptions", {
      customer: customerId, billingType, value: 29.90, nextDueDate, cycle: "MONTHLY", description: "SisteNext ERP"
    });

    // 3. Payment Details
    const payments = await asaasRequest("GET", `/subscriptions/${subRes.id}/payments`);
    const p = payments.data?.[0] || {};
    
    const activeSubscription = {
      subscriptionId: subRes.id, paymentId: p.id, status: p.status, billingType, 
      paymentMethod, value: 29.90, nextDueDate, invoiceUrl: p.invoiceUrl || p.bankSlipUrl,
      customerName: clientName, customerEmail: email, createdAt: new Date().toISOString()
    };

    if (db) await setDoc(doc(db, "configuracoes", ownerId), { activeSubscription, updatedAt: new Date().toISOString() }, { merge: true });
    res.json({ success: true, activeSubscription });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/asaas/cancelar", async (req, res) => {
  try {
    const { subscriptionId, ownerId } = req.body;
    await asaasRequest("DELETE", `/subscriptions/${subscriptionId}`);
    if (db) await updateDoc(doc(db, "configuracoes", ownerId), { "activeSubscription.status": "CANCELLED", updatedAt: new Date().toISOString() });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/asaas/status/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { ownerId } = req.query;
    const p = await asaasRequest("GET", `/payments/${paymentId}`);
    if (ownerId && db) await updateDoc(doc(db, "configuracoes", ownerId as string), { "activeSubscription.status": p.status, updatedAt: new Date().toISOString() });
    res.json({ status: p.status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/webhook/asaas", async (req, res) => {
  try {
    if (req.headers["asaas-access-token"] !== process.env.ASAAS_WEBHOOK_TOKEN) return res.status(401).send();
    const { event, payment } = req.body;
    const subId = payment?.subscription;
    if (subId && db) {
      const q = query(collection(db, "configuracoes"), where("activeSubscription.subscriptionId", "==", subId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        let status = "PENDING";
        if (event.includes("RECEIVED") || event.includes("CONFIRMED")) status = "RECEIVED";
        if (event === "PAYMENT_OVERDUE") status = "OVERDUE";
        if (event === "SUBSCRIPTION_DELETED") status = "CANCELLED";
        await updateDoc(snap.docs[0].ref, { "activeSubscription.status": status, updatedAt: new Date().toISOString() });
      }
    }
    res.json({ received: true });
  } catch (err) { res.status(500).send(); }
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Static / Vite Setup
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error("[Vite Init Error]:", e);
    }
  } else {
    const dist = path.join(process.cwd(), "dist");
    if (fs.existsSync(dist)) {
      app.use(express.static(dist));
      app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));
    }
  }

  // Only start listening if NOT in a serverless environment (like Vercel)
  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

bootstrap().catch(err => {
  console.error("[Bootstrap Error]:", err);
});

export default app;
