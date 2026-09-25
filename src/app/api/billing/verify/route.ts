import { z } from "zod";
import { AIError } from "@/lib/ai";
import { verifyCinetpay } from "@/lib/billing";
import { handler } from "@/lib/route";
import { createClient } from "@/lib/supabase/server";

/** Vérifie un paiement Mobile Money de l'utilisateur connecté (au retour de CinetPay). */
export const POST = handler(z.object({ reference: z.string().max(100) }), async ({ reference }) => {
  const supabase = await createClient(); // RLS : uniquement ses propres paiements
  const { data } = await supabase.from("payments").select("reference").eq("reference", reference).single();
  if (!data) throw new AIError("Paiement introuvable.", 404);
  return { status: await verifyCinetpay(reference) };
});
