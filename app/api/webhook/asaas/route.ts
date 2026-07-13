// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

// Inicializa o Firebase Admin SDK (pode ser colocado em um arquivo separado de inicialização)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  } catch (error) {
    console.error("Erro ao inicializar Firebase Admin:", error);
  }
}

/**
 * WEBHOOK DA ASAAS - NEXT.JS 15 (APP ROUTER)
 * Rota: /api/webhook/asaas
 * 
 * Este webhook valida a autenticidade da requisição por meio do cabeçalho 'asaas-access-token'
 * e processa atualizações de status de pagamento e de assinaturas no Firebase Firestore.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Validar a autenticidade da requisição (Token do Webhook)
    const webhookToken = req.headers.get("asaas-access-token");
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

    if (!expectedToken) {
      console.error("[Asaas Webhook] Token de validação ASAAS_WEBHOOK_TOKEN não configurado nas variáveis de ambiente.");
      return NextResponse.json({ error: "Configuração do servidor pendente" }, { status: 500 });
    }

    if (!webhookToken || webhookToken !== expectedToken) {
      console.warn("[Asaas Webhook] Tentativa de acesso não autorizada. Token inválido.");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Extrair o corpo da requisição
    const body = await req.json();
    const { event, payment, subscription: subscriptionData } = body;

    console.log(`[Asaas Webhook] Evento recebido: ${event}`);

    const db = admin.firestore();

    // 3. Tratar os eventos solicitados
    if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
      const subscriptionId = payment?.subscription;
      const paymentId = payment?.id;
      const paymentStatus = payment?.status;
      const paymentDate = payment?.paymentDate || new Date().toISOString().split("T")[0];

      if (!subscriptionId) {
        console.log("[Asaas Webhook] Pagamento avulso recebido, ignorando pois não possui assinatura vinculada.");
        return NextResponse.json({ received: true });
      }

      console.log(`[Asaas Webhook] Processando pagamento para Assinatura ${subscriptionId}. Status: ${paymentStatus}`);

      // Buscar o documento do usuário que possui esta assinatura associada
      const snapshot = await db.collection("configuracoes")
        .where("activeSubscription.subscriptionId", "==", subscriptionId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.warn(`[Asaas Webhook] Nenhuma configuração encontrada para a assinatura ${subscriptionId}`);
        return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      const activeSub = data.activeSubscription || {};

      // Atualiza os campos de status de pagamento
      const updatedSubscription = {
        ...activeSub,
        status: paymentStatus, // "RECEIVED" ou "CONFIRMED"
        paymentDate,
        paymentId: paymentId || activeSub.paymentId,
        updatedAt: new Date().toISOString(),
      };

      await doc.ref.update({
        activeSubscription: updatedSubscription,
        updatedAt: new Date().toISOString(),
      });

      console.log(`[Asaas Webhook] Status da assinatura do usuário atualizado para Ativo/Pago no Firebase (Doc: ${doc.id})`);
    } 
    else if (event === "PAYMENT_OVERDUE") {
      const subscriptionId = payment?.subscription;

      if (!subscriptionId) {
        return NextResponse.json({ received: true });
      }

      console.log(`[Asaas Webhook] Pagamento vencido para a assinatura ${subscriptionId}`);

      const snapshot = await db.collection("configuracoes")
        .where("activeSubscription.subscriptionId", "==", subscriptionId)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        const activeSub = data.activeSubscription || {};

        const updatedSubscription = {
          ...activeSub,
          status: "OVERDUE",
          updatedAt: new Date().toISOString(),
        };

        await doc.ref.update({
          activeSubscription: updatedSubscription,
          updatedAt: new Date().toISOString(),
        });

        console.log(`[Asaas Webhook] Status da assinatura do usuário atualizado para VENCIDO/OVERDUE (Doc: ${doc.id})`);
      }
    } 
    else if (event === "SUBSCRIPTION_DELETED") {
      const subscriptionId = subscriptionData?.id;

      if (!subscriptionId) {
        return NextResponse.json({ error: "ID da assinatura não fornecido" }, { status: 400 });
      }

      console.log(`[Asaas Webhook] Assinatura ${subscriptionId} excluída/cancelada no Asaas.`);

      const snapshot = await db.collection("configuracoes")
        .where("activeSubscription.subscriptionId", "==", subscriptionId)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        const activeSub = data.activeSubscription || {};

        const updatedSubscription = {
          ...activeSub,
          status: "CANCELLED",
          updatedAt: new Date().toISOString(),
        };

        await doc.ref.update({
          activeSubscription: updatedSubscription,
          updatedAt: new Date().toISOString(),
        });

        console.log(`[Asaas Webhook] Status da assinatura do usuário atualizado para CANCELADO/CANCELLED (Doc: ${doc.id})`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Asaas Webhook] Erro crítico ao processar requisição:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
