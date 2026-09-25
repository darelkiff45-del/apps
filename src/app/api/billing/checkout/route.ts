import { z } from "zod";
import { getProfile } from "@/lib/account";
import { cinetpayCheckout, stripeCheckout } from "@/lib/billing";
import { handler } from "@/lib/route";

const Input = z.object({
  plan: z.enum(["starter", "pro", "business"]),
  provider: z.enum(["stripe", "cinetpay"]),
});

/** Crée une session de paiement et renvoie l'URL vers laquelle rediriger l'utilisateur. */
export const POST = handler(Input, async ({ plan, provider }, { user }) => {
  if (provider === "stripe") {
    const profile = await getProfile(user.id);
    return { url: await stripeCheckout({ userId: user.id, email: user.email, customerId: profile.stripe_customer_id, plan }) };
  }
  const { url } = await cinetpayCheckout({ userId: user.id, email: user.email, plan });
  return { url };
});
