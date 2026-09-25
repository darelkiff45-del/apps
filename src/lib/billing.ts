import "server-only";
import Stripe from "stripe";
import { AIError } from "./ai";
import { PLANS, type PlanId } from "./plans";
import { createAdmin } from "./supabase/server";

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

/* ------------------------------- Stripe (carte) ------------------------------- */

let stripe: Stripe | null = null;
export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new AIError("Paiement par carte non configuré (STRIPE_SECRET_KEY).", 503);
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripe;
}

export async function stripeCheckout(opts: { userId: string; email?: string; customerId: string | null; plan: Exclude<PlanId, "free"> }) {
  const plan = PLANS[opts.plan];
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "xof", // FCFA (devise sans décimales chez Stripe)
          unit_amount: plan.priceXof,
          recurring: { interval: "month" },
          product_data: { name: `Créateur Digital — ${plan.name}` },
        },
      },
    ],
    ...(opts.customerId ? { customer: opts.customerId } : { customer_email: opts.email }),
    client_reference_id: opts.userId,
    metadata: { user_id: opts.userId, plan: plan.id },
    subscription_data: { metadata: { user_id: opts.userId, plan: plan.id } },
    success_url: `${appUrl()}/studio/compte?paiement=ok`,
    cancel_url: `${appUrl()}/tarifs?paiement=annule`,
  });
  if (!session.url) throw new AIError("Impossible de créer la page de paiement.", 502);
  return session.url;
}

/* --------------------------- CinetPay (Mobile Money) --------------------------- */

const CINETPAY = "https://api-checkout.cinetpay.com/v2";

function cinetpayKeys() {
  const apikey = process.env.CINETPAY_API_KEY;
  const site_id = process.env.CINETPAY_SITE_ID;
  if (!apikey || !site_id) throw new AIError("Paiement Mobile Money non configuré (CINETPAY_API_KEY / CINETPAY_SITE_ID).", 503);
  return { apikey, site_id };
}

export async function cinetpayCheckout(opts: { userId: string; email?: string; plan: Exclude<PlanId, "free"> }) {
  const plan = PLANS[opts.plan];
  const reference = `CD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();

  const admin = createAdmin();
  const { error } = await admin.from("payments").insert({
    user_id: opts.userId,
    provider: "cinetpay",
    plan: plan.id,
    amount: plan.priceXof,
    currency: "XOF",
    reference,
  });
  if (error) throw new AIError("Impossible d'enregistrer le paiement.", 500);

  const res = await fetch(`${CINETPAY}/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...cinetpayKeys(),
      transaction_id: reference,
      amount: plan.priceXof, // doit être un multiple de 5
      currency: "XOF",
      description: `Abonnement ${plan.name} (30 jours)`,
      channels: "MOBILE_MONEY",
      notify_url: `${appUrl()}/api/webhooks/cinetpay`,
      return_url: `${appUrl()}/api/billing/cinetpay-return?ref=${reference}`,
      customer_email: opts.email,
      metadata: opts.userId,
      lang: "fr",
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (json.code !== "201" || !json.data?.payment_url) {
    await admin.from("payments").update({ status: "failed" }).eq("reference", reference);
    throw new AIError(`CinetPay : ${json.description || json.message || "erreur à l'initialisation"}`, 502);
  }
  return { url: json.data.payment_url as string, reference };
}

/**
 * Vérifie un paiement CinetPay auprès de leur API (on ne fait jamais confiance au navigateur
 * ni au contenu de la notification) et active la formule pour 30 jours s'il est accepté.
 */
export async function verifyCinetpay(reference: string): Promise<"paid" | "pending" | "failed"> {
  const admin = createAdmin();
  const { data: payment } = await admin.from("payments").select("*").eq("reference", reference).eq("provider", "cinetpay").single();
  if (!payment) return "failed";
  if (payment.status === "paid") return "paid";

  const res = await fetch(`${CINETPAY}/payment/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...cinetpayKeys(), transaction_id: reference }),
  });
  const json = await res.json().catch(() => ({}));
  const status = json.data?.status as string | undefined;
  const amount = Number(json.data?.amount);

  if (status === "ACCEPTED" && amount >= payment.amount && json.data?.currency === "XOF") {
    await admin.rpc("activate_plan", { p_reference: reference, p_days: 30 });
    return "paid";
  }
  if (status === "REFUSED" || status === "CANCELED") {
    await admin.from("payments").update({ status: "failed" }).eq("reference", reference).eq("status", "pending");
    return "failed";
  }
  return "pending";
}
