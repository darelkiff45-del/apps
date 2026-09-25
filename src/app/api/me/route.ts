import { NextResponse } from "next/server";
import { getProfile, requireUser } from "@/lib/account";
import { errorResponse } from "@/lib/route";
import { createClient } from "@/lib/supabase/server";

/** Profil, formule, crédits, historique de consommation et paiements. */
export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const profile = await getProfile(user.id);
    if (new URL(req.url).searchParams.get("details") !== "1") {
      return NextResponse.json({ profile });
    }
    const supabase = await createClient();
    const [usage, payments] = await Promise.all([
      supabase.from("usage").select("kind, credits, created_at").order("created_at", { ascending: false }).limit(30),
      supabase.from("payments").select("provider, plan, amount, currency, status, created_at").order("created_at", { ascending: false }).limit(20),
    ]);
    return NextResponse.json({ profile, usage: usage.data || [], payments: payments.data || [] });
  } catch (err) {
    return errorResponse(err);
  }
}
