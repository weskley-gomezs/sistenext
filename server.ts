import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

dotenv.config();

const app = express();
app.use(express.json());

// Firebase initialization using Firebase Admin SDK
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let db: any = null;

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    const databaseId = firebaseConfig.firestoreDatabaseId;
    let firebaseApp: any = null;
    
    // Ensure FIREBASE_SERVICE_ACCOUNT is configured to bypass confusing permission errors
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountVar) {
      throw new Error("A variável de ambiente 'FIREBASE_SERVICE_ACCOUNT' não está configurada. Por favor, adicione as credenciais em formato JSON nas variáveis de ambiente.");
    }

    try {
      const serviceAccount = JSON.parse(serviceAccountVar);
      firebaseApp = initializeApp({
        credential: cert(serviceAccount)
      });
      console.log("[Firebase Admin] Inicializado com sucesso utilizando Service Account.");
    } catch (parseErr: any) {
      throw new Error(`Falha ao parsear o JSON da variável de ambiente 'FIREBASE_SERVICE_ACCOUNT': ${parseErr.message}`);
    }
    
    // Create firestore instance with custom databaseId
    db = getFirestore(firebaseApp, databaseId);
    console.log("[Firebase Admin Server] Initialized Firestore database:", databaseId);
  } catch (err) {
    console.error("[Firebase Admin Server Init Error]:", err);
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
  if (!apiKey || apiKey.trim() === "" || apiKey.includes("MY_ASAAS") || apiKey.includes("YOUR_")) {
    throw new Error("A chave de API do Asaas não está configurada. Por favor, acesse o menu Configurações > Secrets na barra lateral do AI Studio e defina a variável 'ASAAS_API_KEY' com sua chave de API do Asaas (Sandbox ou Produção).");
  }

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
    if (msg.includes("chave de API fornecida é inválida") || response.status === 401 || response.status === 403) {
      throw new Error("A chave de API fornecida para o Asaas é inválida ou expirou. Por favor, acesse o menu Configurações > Secrets na barra lateral do AI Studio e atualize a variável 'ASAAS_API_KEY' com uma chave de API válida.");
    }
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

    if (db) {
      await db.collection("configuracoes").doc(ownerId).set({ activeSubscription, updatedAt: new Date().toISOString() }, { merge: true });
    }
    res.json({ success: true, activeSubscription });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/asaas/cancelar", async (req, res) => {
  try {
    const { subscriptionId, ownerId } = req.body;
    await asaasRequest("DELETE", `/subscriptions/${subscriptionId}`);
    if (db) {
      await db.collection("configuracoes").doc(ownerId).update({ "activeSubscription.status": "CANCELLED", updatedAt: new Date().toISOString() });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CLIENT SUBSCRIPTIONS ENDPOINTS
app.post("/api/asaas/criar-assinatura-cliente", async (req, res) => {
  try {
    const { clientId, clientName, email, cnpjCpf, paymentMethod, value, cycle, description, ownerId } = req.body;
    if (!ownerId || !clientId || !clientName || !email) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes" });
    }

    // 1. Resolve customer in Asaas
    let customerId = "";
    const cleanDoc = cnpjCpf?.replace(/\D/g, "");
    try {
      const search = await asaasRequest("GET", `/customers?email=${encodeURIComponent(email)}${cleanDoc ? `&cpfCnpj=${cleanDoc}` : ""}`);
      if (search.data?.[0]) customerId = search.data[0].id;
    } catch (e) {
      console.warn("Could not find customer by search", e);
    }

    if (!customerId) {
      const customer = await asaasRequest("POST", "/customers", { name: clientName, email, cpfCnpj: cleanDoc });
      customerId = customer.id;
    }

    // 2. Create the subscription in Asaas
    const billingType = paymentMethod === "Boleto" ? "BOLETO" : (paymentMethod === "Crédito" ? "CREDIT_CARD" : "PIX");
    const nextDueDate = new Date(Date.now() + 86400000).toISOString().split("T")[0]; // tomorrow
    const cycleValue = cycle === "Anual" ? "YEARLY" : "MONTHLY";

    const subRes = await asaasRequest("POST", "/subscriptions", {
      customer: customerId,
      billingType,
      value: Number(value),
      nextDueDate,
      cycle: cycleValue,
      description: description || `Assinatura - ${clientName}`
    });

    // 3. Get first payment details
    let p: any = {};
    try {
      const payments = await asaasRequest("GET", `/subscriptions/${subRes.id}/payments`);
      p = payments.data?.[0] || {};
    } catch (e) {
      console.error("Erro ao carregar pagamentos da assinatura", e);
    }

    const subscriptionData = {
      ownerId,
      clientId,
      clientName,
      clientEmail: email,
      value: Number(value),
      cycle, // "Mensal" | "Anual"
      paymentMethod, // "Pix" | "Boleto" | "Crédito"
      status: "Ativa",
      description: description || `Assinatura Recorrente`,
      asaasSubscriptionId: subRes.id,
      asaasCustomerId: customerId,
      invoiceUrl: p.invoiceUrl || p.bankSlipUrl || "",
      paymentId: p.id || "",
      nextDueDate: subRes.nextDueDate || nextDueDate,
      createdAt: new Date().toISOString()
    };

    if (db) {
      // Save subscription in Firestore
      const docRef = db.collection("assinaturas_clientes").doc();
      const finalDoc = { ...subscriptionData, id: docRef.id };
      await docRef.set(finalDoc);

      // Create a pending transaction entry in the financeiro ledger to reflect this new charge
      const finRef = db.collection("financeiro").doc();
      await finRef.set({
        id: finRef.id,
        ownerId,
        description: `${description || "Assinatura"} (${cycle === "Anual" ? "Anual" : "Mensal"})`,
        type: "Receber",
        category: "Mensalidade",
        value: Number(value),
        status: "Pendente",
        date: nextDueDate,
        clientName,
        paymentMethod: paymentMethod === "Crédito" ? "Crédito" : (paymentMethod === "Boleto" ? "Boleto" : "Pix"),
        createdAt: new Date().toISOString(),
        asaasId: subRes.id,
        asaasPaymentUrl: p.invoiceUrl || p.bankSlipUrl || ""
      });

      res.json({ success: true, subscription: finalDoc });
    } else {
      res.json({ success: true, subscription: subscriptionData });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/asaas/cancelar-assinatura-cliente", async (req, res) => {
  try {
    const { asaasSubscriptionId, id, ownerId } = req.body;
    if (!asaasSubscriptionId || !id) {
      return res.status(400).json({ error: "Missing subscription ids" });
    }

    try {
      await asaasRequest("DELETE", `/subscriptions/${asaasSubscriptionId}`);
    } catch (e: any) {
      console.warn("Error deleting from Asaas (might already be deleted or invalid)", e);
    }

    if (db) {
      await db.collection("assinaturas_clientes").doc(id).update({
        status: "Cancelada",
        updatedAt: new Date().toISOString()
      });
    }

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
    if (ownerId && db) {
      await db.collection("configuracoes").doc(ownerId as string).update({ "activeSubscription.status": p.status, updatedAt: new Date().toISOString() });
    }
    res.json({ success: true, status: p.status });
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
      const snap = await db.collection("configuracoes").where("activeSubscription.subscriptionId", "==", subId).get();
      if (!snap.empty) {
        let status = "PENDING";
        if (event.includes("RECEIVED") || event.includes("CONFIRMED")) status = "RECEIVED";
        if (event === "PAYMENT_OVERDUE") status = "OVERDUE";
        if (event === "SUBSCRIPTION_DELETED") status = "CANCELLED";
        await snap.docs[0].ref.update({ "activeSubscription.status": status, updatedAt: new Date().toISOString() });
      }
    }
    res.json({ received: true });
  } catch (err) { res.status(500).send(); }
});

app.get("/api/asaas/config-status", (req, res) => {
  const apiKey = process.env.ASAAS_API_KEY;
  const isConfigured = !!apiKey && apiKey.trim() !== "" && !apiKey.includes("MY_ASAAS") && !apiKey.includes("YOUR_");
  const isSandbox = isConfigured ? (apiKey.includes("test") || process.env.ASAAS_SANDBOX === "true") : true;
  res.json({
    configured: isConfigured,
    environment: isSandbox ? "sandbox" : "production"
  });
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
