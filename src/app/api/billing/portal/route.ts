import { z } from "zod";
import { getProfile } from "@/lib/account";
import { AIError } from "@/lib/ai";
import { appUrl, getStripe } from "@/lib/billing";
import { handler } from "@/lib/route";

/** Portail Stripe : changer de carte, voir les factures, résilier. */
export const POST = handler(z.object({}), async (_, { user }) => {
  const profile = await getProfile(user.id);
  if (!profile.stripe_customer_id) throw new AIError("Aucun abonnement par carte.", 400);
  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${appUrl()}/studio/compte`,
  });
  return { url: session.url };
});
