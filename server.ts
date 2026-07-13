import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import fs from "fs";

dotenv.config();

// Read Firebase config safely from file system to avoid bundling or import path issues
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
} else {
  console.warn("[Firebase Server] Warning: firebase-applet-config.json not found.");
}

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Safe lazy-initialization check for Gemini API key
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in the environment.");
    }
    return new GoogleGenAI({ apiKey });
  };

  // API Route for Gemini AI Operations
  app.post("/api/chat-gemini", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      if (!prompt) {
        res.status(400).json({ error: "Prompt is required" });
        return;
      }

      const ai = getAiClient();
      
      const config: any = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: config
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Internal AI Server Error" });
    }
  });

  // Helper for making requests to the Asaas API
  async function asaasRequest(method: string, path: string, body?: any) {
    const apiKey = process.env.ASAAS_API_KEY;
    if (!apiKey) {
      throw new Error("Chave da API do Asaas (ASAAS_API_KEY) não configurada.");
    }

    // Determine base URL: production vs sandbox
    const isProd = !apiKey.includes("test") && process.env.ASAAS_SANDBOX !== "true";
    const baseUrl = isProd ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/v3";
    const url = `${baseUrl}${path}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "access_token": apiKey,
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      let parsedError: any;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        parsedError = { errors: [{ description: errorText }] };
      }
      const description = parsedError?.errors?.[0]?.description || parsedError?.errors?.[0]?.message || "Erro desconhecido na API do Asaas";
      throw new Error(description);
    }

    return response.json();
  }

  // Route to create a subscription (R$ 29,90)
  app.post("/api/asaas/assinar", async (req, res) => {
    try {
      const { clientName, email, phone, cnpjCpf, paymentMethod, ownerId } = req.body;
      if (!ownerId) {
        res.status(400).json({ error: "ownerId é obrigatório" });
        return;
      }
      if (!clientName || !email) {
        res.status(400).json({ error: "Nome e E-mail são obrigatórios" });
        return;
      }

      const apiKey = process.env.ASAAS_API_KEY;
      if (!apiKey) {
        res.status(400).json({ error: "Chave da API do Asaas (ASAAS_API_KEY) não está configurada no servidor." });
        return;
      }

      console.log(`[Asaas Sub] Iniciando assinatura para ${clientName} (${email}) - ownerId: ${ownerId}`);

      // 1. Find or create customer
      let customerId = "";
      const cleanCpfCnpj = cnpjCpf ? cnpjCpf.replace(/\D/g, "") : "";

      try {
        let searchPath = `/customers?email=${encodeURIComponent(email)}`;
        if (cleanCpfCnpj) {
          searchPath += `&cpfCnpj=${encodeURIComponent(cleanCpfCnpj)}`;
        }
        const searchRes = await asaasRequest("GET", searchPath);
        if (searchRes.data && searchRes.data.length > 0) {
          customerId = searchRes.data[0].id;
          console.log(`[Asaas Sub] Cliente existente encontrado: ${customerId}`);
        }
      } catch (err) {
        console.warn("[Asaas Sub] Erro ao buscar cliente, tentando criar:", err);
      }

      if (!customerId) {
        const customerPayload: any = {
          name: clientName,
          email: email,
        };
        if (phone) customerPayload.phone = phone.replace(/\D/g, "");
        if (cleanCpfCnpj) customerPayload.cpfCnpj = cleanCpfCnpj;

        const customerRes = await asaasRequest("POST", "/customers", customerPayload);
        customerId = customerRes.id;
        console.log(`[Asaas Sub] Novo cliente criado: ${customerId}`);
      }

      // 2. Map billingType
      let billingType = "PIX";
      if (paymentMethod === "Boleto") {
        billingType = "BOLETO";
      } else if (paymentMethod === "Crédito") {
        billingType = "CREDIT_CARD";
      }

      // 3. Create monthly subscription of 29.90
      // Due date set to tomorrow to be safe
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextDueDate = tomorrow.toISOString().split("T")[0];

      const subscriptionPayload = {
        customer: customerId,
        billingType,
        value: 29.90,
        nextDueDate,
        cycle: "MONTHLY",
        description: "Assinatura Mensal SisteNext ERP",
      };

      console.log("[Asaas Sub] Criando assinatura:", subscriptionPayload);
      const subscriptionRes = await asaasRequest("POST", "/subscriptions", subscriptionPayload);
      const subscriptionId = subscriptionRes.id;
      console.log(`[Asaas Sub] Assinatura criada: ${subscriptionId}`);

      // 4. Fetch the payments generated for this subscription
      const paymentsRes = await asaasRequest("GET", `/subscriptions/${subscriptionId}/payments`);
      let paymentId = "";
      let invoiceUrl = "";
      let status = "PENDING";

      if (paymentsRes.data && paymentsRes.data.length > 0) {
        paymentId = paymentsRes.data[0].id;
        invoiceUrl = paymentsRes.data[0].invoiceUrl || paymentsRes.data[0].bankSlipUrl;
        status = paymentsRes.data[0].status;
      }

      // 5. Fetch QR code or Barcode if applicable
      let pixQrCode = "";
      let pixCopyPaste = "";
      let barCode = "";
      let identificationField = "";

      if (paymentId) {
        if (billingType === "PIX") {
          try {
            const pixRes = await asaasRequest("GET", `/payments/${paymentId}/pixQrCode`);
            pixQrCode = pixRes.encodedImage;
            pixCopyPaste = pixRes.payload;
          } catch (err) {
            console.error("[Asaas Sub] Falha ao obter QR Code PIX:", err);
          }
        } else if (billingType === "BOLETO") {
          try {
            const slipRes = await asaasRequest("GET", `/payments/${paymentId}/identificationField`);
            barCode = slipRes.barCode;
            identificationField = slipRes.identificationField;
          } catch (err) {
            console.error("[Asaas Sub] Falha ao obter dados do boleto:", err);
          }
        }
      }

      // 6. Save subscription details in Firestore
      const activeSubscription = {
        subscriptionId,
        paymentId,
        status,
        billingType,
        paymentMethod,
        value: 29.90,
        nextDueDate,
        invoiceUrl,
        pixQrCode,
        pixCopyPaste,
        barCode,
        identificationField,
        customerName: clientName,
        customerEmail: email,
        customerPhone: phone || "",
        customerCnpjCpf: cnpjCpf || "",
        createdAt: new Date().toISOString()
      };

      if (db) {
        try {
          const docRef = doc(db, "configuracoes", ownerId);
          const snap = await getDoc(docRef);
          const currentConfig = snap.exists() ? snap.data() : {};
          await setDoc(docRef, {
            ...currentConfig,
            activeSubscription,
            updatedAt: new Date().toISOString()
          });
          console.log(`[Asaas Sub] Sub salva no Firestore para ${ownerId}`);
        } catch (dbErr) {
          console.error("[Asaas Sub] Erro ao persistir sub no Firestore:", dbErr);
        }
      }

      res.json({
        success: true,
        activeSubscription
      });
    } catch (error: any) {
      console.error("[Asaas Sub] Erro ao assinar:", error);
      res.status(500).json({ error: error.message || "Erro interno ao processar assinatura" });
    }
  });

  // Route to cancel a subscription
  app.post("/api/asaas/cancelar", async (req, res) => {
    try {
      const { subscriptionId, ownerId } = req.body;
      if (!subscriptionId || !ownerId) {
        res.status(400).json({ error: "subscriptionId e ownerId são obrigatórios" });
        return;
      }

      console.log(`[Asaas Sub] Cancelando assinatura ${subscriptionId} do owner ${ownerId}`);

      // Call Asaas API to delete
      await asaasRequest("DELETE", `/subscriptions/${subscriptionId}`);

      // Update in Firestore
      if (db) {
        try {
          const docRef = doc(db, "configuracoes", ownerId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const currentConfig = snap.data();
            if (currentConfig.activeSubscription) {
              currentConfig.activeSubscription.status = "CANCELLED";
            }
            await setDoc(docRef, {
              ...currentConfig,
              updatedAt: new Date().toISOString()
            });
            console.log(`[Asaas Sub] Assinatura marcada como CANCELLED no Firestore`);
          }
        } catch (dbErr) {
          console.error("[Asaas Sub] Erro ao atualizar cancelamento no Firestore:", dbErr);
        }
      }

      res.json({ success: true, message: "Assinatura cancelada com sucesso" });
    } catch (error: any) {
      console.error("[Asaas Sub] Erro no cancelamento:", error);
      res.status(500).json({ error: error.message || "Erro interno ao cancelar assinatura" });
    }
  });

  // Route to sync payment status
  app.get("/api/asaas/status/:paymentId", async (req, res) => {
    try {
      const { paymentId } = req.params;
      const { ownerId } = req.query;

      if (!paymentId) {
        res.status(400).json({ error: "paymentId é obrigatório" });
        return;
      }

      console.log(`[Asaas Sub] Sincronizando status de pagamento: ${paymentId}`);
      const paymentRes = await asaasRequest("GET", `/payments/${paymentId}`);
      const status = paymentRes.status;
      const paymentDate = paymentRes.paymentDate || null;

      if (ownerId && typeof ownerId === "string" && db) {
        try {
          const docRef = doc(db, "configuracoes", ownerId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const currentConfig = snap.data();
            if (currentConfig.activeSubscription && currentConfig.activeSubscription.paymentId === paymentId) {
              currentConfig.activeSubscription.status = status;
              if (paymentDate) {
                currentConfig.activeSubscription.paymentDate = paymentDate;
              }
              await setDoc(docRef, {
                ...currentConfig,
                updatedAt: new Date().toISOString()
              });
              console.log(`[Asaas Sub] Firestore atualizado com status de pagamento: ${status}`);
            }
          }
        } catch (dbErr) {
          console.error("[Asaas Sub] Erro ao atualizar status no Firestore:", dbErr);
        }
      }

      res.json({
        success: true,
        status,
        paymentDate
      });
    } catch (error: any) {
      console.error("[Asaas Sub] Erro na consulta de status:", error);
      res.status(500).json({ error: error.message || "Erro ao consultar status de pagamento" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Serve static assets/dev server depending on environment
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sistemax Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
