import express from "express";
import path from "path";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable trust proxy so express-rate-limit can accurately identify users behind the reverse proxy
app.set("trust proxy", 1);

// --- HELMET CONFIGURATION ---
// Configured to support rendering inside Google AI Studio preview iframes securely
app.use(helmet({
  frameguard: false, // Disabled standard block to allow AI Studio iframe preview, CSP frameAncestors handles it securely
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://i.imgur.com", "https://apis.google.com", "referrer"],
      frameAncestors: ["'self'", "https://ai.studio", "https://*.google.com", "https://*.run.app"],
      connectSrc: ["'self'", "https://firestore.googleapis.com", "https://*.firebase.io", "https://identitytoolkit.googleapis.com", "https://*.googleapis.com"]
    }
  },
  dnsPrefetchControl: { allow: false },
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "no-referrer-when-downgrade" },
  xssFilter: true
}));

app.use(express.json());

// --- CORS CONFIGURATION ---
const allowedOrigins = [
  "http://localhost:3000",
  "https://localhost:3000"
];

const corsOptions = {
  origin: (origin: any, callback: any) => {
    if (!origin) return callback(null, true);
    
    // Dynamically allow AI Studio preview URLs (*.run.app) and localhost
    const isAiStudio = origin.includes("run.app") || origin.includes("aistudio");
    const isAllowedLocal = origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:");
    
    if (isAiStudio || isAllowedLocal || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS Bloqueado: Origem não autorizada pela política de segurança."));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle OPTIONS preflight for all routes securely

// --- RATE LIMITERS ---
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições vindas deste IP. Por favor, tente novamente mais tarde." }
});

const geminiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Limite de uso do chat de IA atingido. Por favor, aguarde um momento antes de enviar uma nova mensagem." }
});

const asaasLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de operação financeira. Aguarde um minuto." }
});

const leadsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de envio de leads. Tente novamente em alguns minutos." }
});

// Apply global rate limiting to all requests
app.use(globalLimiter);

// --- FIREBASE ADMIN INITIALIZATION ---
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let db: any = null;
let firebaseApp: any = null;

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    const databaseId = firebaseConfig.firestoreDatabaseId;
    
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountVar) {
      try {
        const serviceAccount = JSON.parse(serviceAccountVar);
        firebaseApp = initializeApp({
          credential: cert(serviceAccount)
        });
        console.log("[Firebase Admin] Inicializado com sucesso utilizando Service Account.");
      } catch (parseErr: any) {
        console.error(`Falha ao parsear o JSON de FIREBASE_SERVICE_ACCOUNT: ${parseErr.message}`);
      }
    }

    if (!firebaseApp) {
      // Fallback
      firebaseApp = initializeApp({
        projectId: firebaseConfig.projectId
      });
      console.log("[Firebase Admin] Inicializado utilizando Project ID (fallback).");
    }
    
    db = getFirestore(firebaseApp, databaseId);
    console.log("[Firebase Admin Server] Initialized Firestore database ID:", databaseId);
  } catch (err) {
    console.error("[Firebase Admin Server Init Error]:", err);
  }
}

// --- SECURITY HELPERS (VALIDATION, SANITIZATION & LGPD LOGGING) ---

function sanitizeInput(str: any): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "") // Script tag removal
    .replace(/<\/?[^>]+(>|$)/g, "")                     // HTML tags removal
    .trim();
}

function validateEmail(email: any): boolean {
  if (typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 150;
}

function validateCpfCnpj(val: any): boolean {
  if (typeof val !== "string") return false;
  const clean = val.replace(/\D/g, "");
  return (clean.length === 11 || clean.length === 14) && clean.length <= 20;
}

function validatePhone(phone: any): boolean {
  if (typeof phone !== "string") return false;
  const clean = phone.replace(/\D/g, "");
  return clean.length >= 8 && clean.length <= 15;
}

function cleanLogData(data: any): any {
  if (!data) return data;
  if (typeof data !== "object") return data;
  
  const clean = Array.isArray(data) ? [...data] : { ...data };
  const sensitiveKeys = [
    "cnpjCpf", "email", "telefone", "phone", "whatsapp", "password", 
    "token", "activeSubscription", "clientName", "nome", "subscriptionId", 
    "paymentId", "asaasSubscriptionId", "asaasCustomerId", "access_token"
  ];
  
  for (const key of Object.keys(clean)) {
    if (sensitiveKeys.includes(key)) {
      clean[key] = "[REDACTED_FOR_SECURITY_LGPD]";
    } else if (typeof clean[key] === "object") {
      clean[key] = cleanLogData(clean[key]);
    }
  }
  return clean;
}

function logSecurityEvent(action: string, metadata: any) {
  const cleanMetadata = cleanLogData(metadata);
  console.log(`[SECURITY_EVENT] [${new Date().toISOString()}] Action: ${action} | Details:`, JSON.stringify(cleanMetadata));
}

// --- UNIFIED AUTHENTICATION & MULTI-TENANT AUTHORIZATION MIDDLEWARE ---

async function authenticateFirebaseUser(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logSecurityEvent("UNAUTHORIZED_ACCESS_ATTEMPT", { path: req.path, ip: req.ip });
      return res.status(401).json({ error: "Acesso negado. Token de autenticação não fornecido." });
    }
    
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (authErr: any) {
      if (process.env.NODE_ENV !== "production" && !process.env.FIREBASE_SERVICE_ACCOUNT) {
        console.warn("[Auth Warning] FIREBASE_SERVICE_ACCOUNT não configurada. Simulando em desenvolvimento.");
        decodedToken = { uid: "jg5b7eIoVFWKsGeyEShOGfviv2h2", email: "vendedor@sistenext.com" };
      } else {
        throw authErr;
      }
    }
    
    req.user = decodedToken;
    next();
  } catch (err: any) {
    logSecurityEvent("INVALID_TOKEN_ATTEMPT", { path: req.path, error: err.message, ip: req.ip });
    res.status(401).json({ error: "Sua sessão expirou ou o token de autenticação é inválido. Por favor, faça login novamente." });
  }
}

// --- EXTERNAL COMPATIBILITY & CONFIGURATION HELPERS ---

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_GEMINI_KEY;
  if (!apiKey) throw new Error("A chave da API Gemini não está configurada (GEMINI_API_KEY ou API_GEMINI_KEY).");
  return new GoogleGenerativeAI(apiKey);
};

function getCleanErrorMessage(err: any): string {
  const errMsg = err?.message || String(err || "");
  let matched = errMsg.match(/\[(4\d\d|5\d\d)[^\]]*\]/);
  if (matched) {
    return `HTTP ${matched[1]}`;
  }
  if (errMsg.includes("Service Unavailable")) {
    return "Service Unavailable (503)";
  }
  if (errMsg.includes("Quota") || errMsg.includes("quota") || errMsg.includes("429")) {
    return "Quota Exceeded (429)";
  }
  if (errMsg.includes("high demand")) {
    return "High Demand (503)";
  }
  return "Transient failure";
}

async function generateContentWithRetry(
  genAI: any,
  prompt: string,
  systemInstruction?: string,
  modelsToTry: string[] = [
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.5-pro'
  ]
): Promise<string> {
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    let retries = 2;
    let delay = 500;

    while (retries > 0) {
      try {
        console.log(`[AI Info] Trying model ${modelName} (${retries} attempts left)...`);
        const modelInstance = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstruction || undefined
        });
        const result = await modelInstance.generateContent(prompt);
        const text = result.response.text();
        if (text) {
          return text;
        }
        throw new Error("Empty response from model.");
      } catch (err: any) {
        lastError = err;
        const errMsg = err.message || '';
        const cleanMsg = getCleanErrorMessage(err);
        console.log(`[AI Info] Model ${modelName} status: ${cleanMsg}`);

        // If it's a hard quota limit (e.g. exceeded your current quota / 429), break immediately and try next model
        if (errMsg.includes("quota") || errMsg.includes("Quota") || errMsg.includes("exceeded")) {
          break;
        }

        // Retry on 503 or transient network/unavailable/resource errors
        if (
          errMsg.includes("503") || 
          errMsg.includes("429") || 
          errMsg.includes("Service Unavailable") || 
          errMsg.includes("Resource has been exhausted") ||
          errMsg.includes("high demand") ||
          errMsg.includes("temporary")
        ) {
          retries--;
          if (retries > 0) {
            console.log(`[AI Info] Waiting ${delay}ms before retrying...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
          }
        } else {
          // Break retry loop for other error types and move to the next model fallback
          break;
        }
      }
    }
  }

  throw new Error(`All fallback models exhausted. Last error: ${getCleanErrorMessage(lastError)}`);
}

async function asaasRequest(method: string, path: string, body?: any) {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey.includes("MY_ASAAS") || apiKey.includes("YOUR_")) {
    throw new Error("A chave de API do Asaas não está configurada.");
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

  logSecurityEvent("ASAAS_API_REQUEST", { method, path });
  
  const response = await fetch(url, options);
  const text = await response.text();
  
  if (!response.ok) {
    let msg = "Asaas API Error";
    try { msg = JSON.parse(text).errors[0].description; } catch { msg = text; }
    if (msg.includes("chave de API fornecida é inválida") || response.status === 401 || response.status === 403) {
      throw new Error("Chave de API do Asaas inválida.");
    }
    throw new Error(msg);
  }
  return JSON.parse(text);
}

// --- SECURED API ENDPOINTS ---

app.post("/api/chat-gemini", authenticateFirebaseUser, geminiLimiter, async (req: any, res: any) => {
  try {
    const { prompt, systemInstruction } = req.body;
    const promptSanitized = sanitizeInput(prompt);
    const systemInstructionSanitized = systemInstruction ? sanitizeInput(systemInstruction) : "";

    if (!promptSanitized) {
      return res.status(400).json({ error: "O prompt não pode ser vazio." });
    }

    const genAI = getAiClient();
    console.log(`[Gemini Request] Iniciando geração no endpoint /api/chat-gemini...`);

    try {
      const text = await generateContentWithRetry(genAI, promptSanitized, systemInstructionSanitized);
      res.json({ text });
    } catch (genErr: any) {
      console.log("[AI Info] Fallback failed for /api/chat-gemini:", genErr.message || genErr);
      res.status(500).json({ error: `Erro na API Gemini: ${genErr.message}` });
    }
  } catch (err: any) {
    console.error("[Gemini Endpoint Error]:", err);
    res.status(500).json({ error: err.message || "Erro interno ao processar requisição de IA." });
  }
});

app.post("/api/gemini", geminiLimiter, async (req: any, res: any) => {
  try {
    const { prompt, systemInstruction } = req.body;
    const promptSanitized = sanitizeInput(prompt);
    const systemInstructionSanitized = systemInstruction ? sanitizeInput(systemInstruction) : "";

    if (!promptSanitized) {
      return res.status(400).json({ error: "O prompt não pode ser vazio." });
    }

    const genAI = getAiClient();
    console.log(`[Gemini Request] Iniciando geração no endpoint /api/gemini...`);

    try {
      const text = await generateContentWithRetry(genAI, promptSanitized, systemInstructionSanitized);
      res.json({ text });
    } catch (genErr: any) {
      console.log("[AI Info] Fallback failed for /api/gemini:", genErr.message || genErr);
      res.status(500).json({ error: `Erro na API Gemini: ${genErr.message}` });
    }
  } catch (err: any) {
    console.error("[Gemini Endpoint Error]:", err);
    res.status(500).json({ error: err.message || "Erro interno ao processar requisição de IA." });
  }
});

app.post("/api/asaas/assinar", authenticateFirebaseUser, asaasLimiter, async (req: any, res: any) => {
  try {
    const { clientName, email, phone, cnpjCpf, paymentMethod } = req.body;
    const ownerId = req.user.uid; // STRICT: extracted from verified Token, never trusted from frontend body!

    const nameSanitized = sanitizeInput(clientName);
    const emailSanitized = sanitizeInput(email);
    const phoneSanitized = sanitizeInput(phone);
    const cnpjCpfSanitized = sanitizeInput(cnpjCpf);
    const methodSanitized = sanitizeInput(paymentMethod);

    if (!nameSanitized || !emailSanitized) {
      return res.status(400).json({ error: "Nome e Email são obrigatórios." });
    }

    if (!validateEmail(emailSanitized)) {
      return res.status(400).json({ error: "Formato de e-mail inválido." });
    }

    // 1. Customer
    let customerId = "";
    const cleanDoc = cnpjCpfSanitized?.replace(/\D/g, "");
    try {
      const search = await asaasRequest("GET", `/customers?email=${encodeURIComponent(emailSanitized)}${cleanDoc ? `&cpfCnpj=${cleanDoc}` : ""}`);
      if (search.data?.[0]) customerId = search.data[0].id;
    } catch (e: any) {
      console.warn("[Asaas Customer Search Warning]:", e.message);
    }

    if (!customerId) {
      const customer = await asaasRequest("POST", "/customers", { 
        name: nameSanitized, 
        email: emailSanitized, 
        phone: phoneSanitized,
        cpfCnpj: cleanDoc 
      });
      customerId = customer.id;
    }

    // 2. Subscription
    const billingType = methodSanitized === "Boleto" ? "BOLETO" : (methodSanitized === "Crédito" ? "CREDIT_CARD" : "PIX");
    const nextDueDate = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const subRes = await asaasRequest("POST", "/subscriptions", {
      customer: customerId, 
      billingType, 
      value: 29.90, 
      nextDueDate, 
      cycle: "MONTHLY", 
      description: "SisteNext ERP"
    });

    // 3. Payment Details
    const payments = await asaasRequest("GET", `/subscriptions/${subRes.id}/payments`);
    const p = payments.data?.[0] || {};
    
    const activeSubscription = {
      subscriptionId: subRes.id, 
      paymentId: p.id, 
      status: p.status, 
      billingType, 
      paymentMethod: methodSanitized, 
      value: 29.90, 
      nextDueDate, 
      invoiceUrl: p.invoiceUrl || p.bankSlipUrl,
      customerName: nameSanitized, 
      customerEmail: emailSanitized, 
      createdAt: new Date().toISOString()
    };

    if (db) {
      await db.collection("configuracoes").doc(ownerId).set({ activeSubscription, updatedAt: new Date().toISOString() }, { merge: true });
    }
    
    logSecurityEvent("SUBSCRIPTION_CREATED", { ownerId, subscriptionId: subRes.id });
    res.json({ success: true, activeSubscription });
  } catch (err: any) {
    logSecurityEvent("SUBSCRIPTION_FAILED", { error: err.message, user: req.user.uid });
    res.status(500).json({ error: err.message || "Erro ao gerar assinatura." });
  }
});

app.post("/api/asaas/cancelar", authenticateFirebaseUser, asaasLimiter, async (req: any, res: any) => {
  try {
    const { subscriptionId } = req.body;
    const ownerId = req.user.uid; // STRICT: extracted from verified Token, never trusted from frontend body!

    const subIdSanitized = sanitizeInput(subscriptionId);
    if (!subIdSanitized) {
      return res.status(400).json({ error: "Subscription ID is required." });
    }

    // Verify subscription actually belongs to owner before deleting in Asaas
    if (db) {
      const configDoc = await db.collection("configuracoes").doc(ownerId).get();
      if (!configDoc.exists || configDoc.data()?.activeSubscription?.subscriptionId !== subIdSanitized) {
        logSecurityEvent("SUSPICIOUS_CANCELLATION_ATTEMPT", { ownerId, attemptedSubId: subIdSanitized });
        return res.status(403).json({ error: "Operação não autorizada. Assinatura não pertence ao tenant." });
      }
    }

    try {
      await asaasRequest("DELETE", `/subscriptions/${subIdSanitized}`);
    } catch (deleteErr: any) {
      console.warn("[Asaas Delete Subscription Warning]:", deleteErr.message);
    }

    if (db) {
      await db.collection("configuracoes").doc(ownerId).update({ 
        "activeSubscription.status": "CANCELLED", 
        updatedAt: new Date().toISOString() 
      });
    }

    logSecurityEvent("SUBSCRIPTION_CANCELLED", { ownerId, subscriptionId: subIdSanitized });
    res.json({ success: true });
  } catch (err: any) {
    logSecurityEvent("SUBSCRIPTION_CANCELLATION_FAILED", { error: err.message, user: req.user.uid });
    res.status(500).json({ error: err.message || "Erro ao cancelar assinatura." });
  }
});

// CLIENT SUBSCRIPTIONS ENDPOINTS
app.post("/api/asaas/criar-assinatura-cliente", authenticateFirebaseUser, asaasLimiter, async (req: any, res: any) => {
  try {
    const { clientId, clientName, email, cnpjCpf, paymentMethod, value, cycle, description } = req.body;
    const ownerId = req.user.uid; // STRICT: extracted from verified Token!

    const clientNameSanitized = sanitizeInput(clientName);
    const emailSanitized = sanitizeInput(email);
    const cnpjCpfSanitized = sanitizeInput(cnpjCpf);
    const methodSanitized = sanitizeInput(paymentMethod);
    const cycleSanitized = sanitizeInput(cycle);
    const descSanitized = sanitizeInput(description);

    if (!clientId || !clientNameSanitized || !emailSanitized) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    if (!validateEmail(emailSanitized)) {
      return res.status(400).json({ error: "Formato de e-mail inválido." });
    }

    // 1. Resolve customer in Asaas
    let customerId = "";
    const cleanDoc = cnpjCpfSanitized?.replace(/\D/g, "");
    try {
      const search = await asaasRequest("GET", `/customers?email=${encodeURIComponent(emailSanitized)}${cleanDoc ? `&cpfCnpj=${cleanDoc}` : ""}`);
      if (search.data?.[0]) customerId = search.data[0].id;
    } catch (e: any) {
      console.warn("[Asaas Customer Search Client Warning]:", e.message);
    }

    if (!customerId) {
      const customer = await asaasRequest("POST", "/customers", { 
        name: clientNameSanitized, 
        email: emailSanitized, 
        cpfCnpj: cleanDoc 
      });
      customerId = customer.id;
    }

    // 2. Create the subscription in Asaas
    const billingType = methodSanitized === "Boleto" ? "BOLETO" : (methodSanitized === "Crédito" ? "CREDIT_CARD" : "PIX");
    const nextDueDate = new Date(Date.now() + 86400000).toISOString().split("T")[0]; // tomorrow
    const cycleValue = cycleSanitized === "Anual" ? "YEARLY" : "MONTHLY";

    const subRes = await asaasRequest("POST", "/subscriptions", {
      customer: customerId,
      billingType,
      value: Number(value),
      nextDueDate,
      cycle: cycleValue,
      description: descSanitized || `Assinatura - ${clientNameSanitized}`
    });

    // 3. Get first payment details
    let p: any = {};
    try {
      const payments = await asaasRequest("GET", `/subscriptions/${subRes.id}/payments`);
      p = payments.data?.[0] || {};
    } catch (e: any) {
      console.error("[Asaas Get Subscription Payments Warning]:", e.message);
    }

    const subscriptionData = {
      ownerId,
      clientId,
      clientName: clientNameSanitized,
      clientEmail: emailSanitized,
      value: Number(value),
      cycle: cycleSanitized,
      paymentMethod: methodSanitized,
      status: "Ativa",
      description: descSanitized || `Assinatura Recorrente`,
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

      // Create a pending transaction entry in the financeiro ledger
      const finRef = db.collection("financeiro").doc();
      await finRef.set({
        id: finRef.id,
        ownerId,
        description: `${descSanitized || "Assinatura"} (${cycleSanitized === "Anual" ? "Anual" : "Mensal"})`,
        type: "Receber",
        category: "Mensalidade",
        value: Number(value),
        status: "Pendente",
        date: nextDueDate,
        clientName: clientNameSanitized,
        paymentMethod: methodSanitized === "Crédito" ? "Crédito" : (methodSanitized === "Boleto" ? "Boleto" : "Pix"),
        createdAt: new Date().toISOString(),
        asaasId: subRes.id,
        asaasPaymentUrl: p.invoiceUrl || p.bankSlipUrl || ""
      });

      logSecurityEvent("CLIENT_SUBSCRIPTION_CREATED", { ownerId, clientId, subscriptionId: subRes.id });
      res.json({ success: true, subscription: finalDoc });
    } else {
      res.json({ success: true, subscription: subscriptionData });
    }
  } catch (err: any) {
    logSecurityEvent("CLIENT_SUBSCRIPTION_FAILED", { error: err.message, user: req.user.uid });
    res.status(500).json({ error: err.message || "Erro ao criar assinatura do cliente." });
  }
});

app.post("/api/asaas/cancelar-assinatura-cliente", authenticateFirebaseUser, asaasLimiter, async (req: any, res: any) => {
  try {
    const { asaasSubscriptionId, id } = req.body;
    const ownerId = req.user.uid; // STRICT: extracted from verified Token!

    const asaasSubIdSanitized = sanitizeInput(asaasSubscriptionId);
    const idSanitized = sanitizeInput(id);

    if (!asaasSubIdSanitized || !idSanitized) {
      return res.status(400).json({ error: "Missing subscription IDs." });
    }

    // STRICT MULTI-TENANT VERIFICATION
    if (db) {
      const docRef = db.collection("assinaturas_clientes").doc(idSanitized);
      const snap = await docRef.get();
      if (!snap.exists || snap.data().ownerId !== ownerId) {
        logSecurityEvent("SUSPICIOUS_CLIENT_CANCELLATION", { ownerId, attemptedId: idSanitized });
        return res.status(403).json({ error: "Você não tem permissão para cancelar esta assinatura de cliente." });
      }
    }

    try {
      await asaasRequest("DELETE", `/subscriptions/${asaasSubIdSanitized}`);
    } catch (e: any) {
      console.warn("[Asaas Delete Client Subscription Warning]:", e.message);
    }

    if (db) {
      await db.collection("assinaturas_clientes").doc(idSanitized).update({
        status: "Cancelada",
        updatedAt: new Date().toISOString()
      });
    }

    logSecurityEvent("CLIENT_SUBSCRIPTION_CANCELLED", { ownerId, id: idSanitized });
    res.json({ success: true });
  } catch (err: any) {
    logSecurityEvent("CLIENT_SUBSCRIPTION_CANCELLATION_FAILED", { error: err.message, user: req.user.uid });
    res.status(500).json({ error: err.message || "Erro ao cancelar assinatura do cliente." });
  }
});

app.get("/api/asaas/status/:paymentId", authenticateFirebaseUser, asaasLimiter, async (req: any, res: any) => {
  try {
    const { paymentId } = req.params;
    const ownerId = req.user.uid; // STRICT: extracted from verified Token!

    const paymentIdSanitized = sanitizeInput(paymentId);
    const p = await asaasRequest("GET", `/payments/${paymentIdSanitized}`);
    
    if (db) {
      await db.collection("configuracoes").doc(ownerId).update({ 
        "activeSubscription.status": p.status, 
        updatedAt: new Date().toISOString() 
      });
    }
    
    logSecurityEvent("SYNCED_SUBSCRIPTION_STATUS", { ownerId, paymentId: paymentIdSanitized, status: p.status });
    res.json({ success: true, status: p.status });
  } catch (err: any) {
    logSecurityEvent("SYNC_FAILED", { error: err.message, user: req.user.uid });
    res.status(500).json({ error: err.message || "Erro ao verificar status de pagamento." });
  }
});

app.post("/api/webhook/asaas", async (req: any, res: any) => {
  try {
    // Validate Webhook Token
    if (req.headers["asaas-access-token"] !== process.env.ASAAS_WEBHOOK_TOKEN) {
      logSecurityEvent("WEBHOOK_UNAUTHORIZED", { headers: req.headers, ip: req.ip });
      return res.status(401).send();
    }
    
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
        logSecurityEvent("WEBHOOK_UPDATED_SUBSCRIPTION", { subscriptionId: subId, status });
      }
    }
    res.json({ received: true });
  } catch (err: any) { 
    logSecurityEvent("WEBHOOK_FAILED", { error: err.message });
    res.status(500).send(); 
  }
});

app.get("/api/asaas/config-status", authenticateFirebaseUser, (req: any, res: any) => {
  const apiKey = process.env.ASAAS_API_KEY;
  const isConfigured = !!apiKey && apiKey.trim() !== "" && !apiKey.includes("MY_ASAAS") && !apiKey.includes("YOUR_");
  const isSandbox = isConfigured ? (apiKey.includes("test") || process.env.ASAAS_SANDBOX === "true") : true;
  res.json({
    configured: isConfigured,
    environment: isSandbox ? "sandbox" : "production"
  });
});

app.post("/api/leads", leadsLimiter, async (req: any, res: any) => {
  try {
    const { nome, telefone, email, origem, dados } = req.body;

    const nomeSanitized = sanitizeInput(nome);
    const telefoneSanitized = sanitizeInput(telefone);
    const emailSanitized = sanitizeInput(email);
    const origemSanitized = sanitizeInput(origem);

    // 1. Validar que nome e telefone existem
    if (!nomeSanitized || !telefoneSanitized) {
      logSecurityEvent("LEAD_CREATION_FAILED", { reason: "Missing mandatory fields", email });
      return res.status(400).json({
        success: false,
        error: "Campos obrigatórios ausentes: nome e telefone são necessários."
      });
    }

    if (emailSanitized && !validateEmail(emailSanitized)) {
      logSecurityEvent("LEAD_CREATION_FAILED", { reason: "Invalid email", email: emailSanitized });
      return res.status(400).json({
        success: false,
        error: "Formato de e-mail inválido."
      });
    }

    if (!validatePhone(telefoneSanitized)) {
      logSecurityEvent("LEAD_CREATION_FAILED", { reason: "Invalid phone", phone: telefoneSanitized });
      return res.status(400).json({
        success: false,
        error: "Número de telefone ou WhatsApp inválido."
      });
    }

    if (!db) {
      logSecurityEvent("LEAD_CREATION_FAILED", { reason: "Database not initialized" });
      return res.status(500).json({
        success: false,
        error: "Banco de dados não inicializado no servidor."
      });
    }

    // Hardcoded ownerId for the default landing page system
    const ownerId = "jg5b7eIoVFWKsGeyEShOGfviv2h2";

    // 2. Salvar no Firestore na coleção 'leads'
    const leadData = {
      ownerId,
      name: nomeSanitized,
      company: sanitizeInput(dados?.titulo || "Lead Web"),
      representative: "API Externa",
      phone: telefoneSanitized,
      whatsapp: telefoneSanitized,
      email: emailSanitized || "",
      instagram: "",
      linkedin: "",
      city: "",
      state: "",
      site: "",
      segment: "Imobiliário",
      employeeCount: 0,
      estimatedRevenue: 0,
      source: origemSanitized || "Site Imobiliária",
      entryDate: new Date().toISOString().split('T')[0],
      notes: dados?.imovelId ? `Interesse no Imóvel ID: ${sanitizeInput(dados.imovelId)}${dados.valor ? ` (Valor: ${Number(dados.valor)})` : ""}` : "Lead recebido via API",
      status: "Novo Lead",
      temperature: "Morno",
      tags: ["API"],
      estimatedValue: Number(dados?.valor) || 0,
      winProbability: 50,
      createdAt: new Date().toISOString(),
      createdBy: "API"
    };

    const docRef = await db.collection("leads").add(leadData);
    logSecurityEvent("LEAD_CREATED_SUCCESSFULLY", { leadId: docRef.id });

    res.json({
      success: true,
      leadId: docRef.id
    });
  } catch (err: any) {
    logSecurityEvent("LEAD_CREATION_ERROR", { error: err.message });
    res.status(500).json({
      success: false,
      error: "Erro interno ao processar lead."
    });
  }
});

app.get("/api/health", (req: any, res: any) => res.json({ status: "ok" }));

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
      app.get("*", (req: any, res: any) => res.sendFile(path.join(dist, "index.html")));
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
