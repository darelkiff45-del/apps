import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/billing";
import { isPaidPlan } from "@/lib/plans";
import { createAdmin } from "@/lib/supabase/server";

/**
 * Événements Stripe :
 * - checkout.session.completed  → lie le client Stripe au profil
 * - invoice.paid                 → active / renouvelle la formule (1er paiement et chaque mois)
 * - customer.subscription.deleted → l'abonnement s'arrête à la fin de la période payée
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) return NextResponse.json({ error: "Webhook non configuré." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  const admin = createAdmin();
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        const userId = s.client_reference_id || s.metadata?.user_id;
        if (userId && typeof s.customer === "string") {
          await admin
            .from("profiles")
            .update({
              stripe_customer_id: s.customer,
              stripe_subscription_id: typeof s.subscription === "string" ? s.subscription : null,
            })
            .eq("id", userId);
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object;
        const meta = invoice.parent?.subscription_details?.metadata;
        const userId = meta?.user_id;
        const plan = meta?.plan;
        if (!invoice.id || !userId || !plan || !isPaidPlan(plan)) break;
        await admin.from("payments").upsert(
          {
            user_id: userId,
            provider: "stripe",
            plan,
            amount: invoice.amount_paid,
            currency: invoice.currency.toUpperCase(),
            reference: invoice.id,
          },
          { onConflict: "reference", ignoreDuplicates: true },
        );
        // 32 jours : petite marge le temps que le renouvellement suivant arrive.
        await admin.rpc("activate_plan", { p_reference: invoice.id, p_days: 32 });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await admin.from("profiles").update({ stripe_subscription_id: null }).eq("stripe_subscription_id", sub.id);
        break;
      }
    }
  } catch (err) {
    console.error("Stripe webhook", err);
    return NextResponse.json({ error: "Erreur de traitement." }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
