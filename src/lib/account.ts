import "server-only";
import type { User } from "@supabase/supabase-js";
import { AIError } from "./ai";
import { COSTS, PLANS, type CostKind, type PlanId } from "./plans";
import { createAdmin, getUser, supabaseConfigured } from "./supabase/server";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: PlanId;
  plan_expires_at: string | null;
  credits: number;
  credits_reset_at: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

export async function requireUser(): Promise<User> {
  if (!supabaseConfigured()) {
    throw new AIError("Supabase n'est pas configuré (voir .env.example).", 503);
  }
  const user = await getUser();
  if (!user) throw new AIError("Connecte-toi pour continuer.", 401);
  return user;
}

/** Profil à jour (applique l'expiration de formule et le renouvellement mensuel des crédits). */
export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await createAdmin().rpc("refresh_profile", { p_user: userId });
  if (error || !data) throw new AIError("Profil introuvable.", 500);
  return data as Profile;
}

/** Débite les crédits, exécute la génération, rembourse si elle échoue. */
export async function withCredits<T>(userId: string, kind: CostKind, fn: () => Promise<T>): Promise<T> {
  const amount = COSTS[kind];
  const admin = createAdmin();
  const { error } = await admin.rpc("consume_credits", { p_user: userId, p_amount: amount, p_kind: kind });
  if (error) {
    if (error.message.includes("insufficient_credits")) {
      throw new AIError(
        `Crédits insuffisants : cette génération coûte ${amount} crédit${amount > 1 ? "s" : ""}. Passe à une formule supérieure pour continuer.`,
        402,
      );
    }
    throw new AIError("Impossible de débiter les crédits.", 500);
  }
  try {
    return await fn();
  } catch (err) {
    await admin.rpc("refund_credits", { p_user: userId, p_amount: amount, p_kind: kind });
    throw err;
  }
}

export async function requireVideoPlan(userId: string) {
  const profile = await getProfile(userId);
  if (!PLANS[profile.plan].videos) {
    throw new AIError("Les vidéos avec avatar IA sont incluses dans les formules Pro et Business.", 402);
  }
  return profile;
}

export type ProjectType = "ebook" | "template" | "site" | "sales-page" | "mockup" | "video";

export async function createProject(userId: string, type: ProjectType, title: string, data: unknown) {
  const { data: row, error } = await createAdmin()
    .from("projects")
    .insert({ user_id: userId, type, title: title.slice(0, 200) || "Sans titre", data })
    .select("id")
    .single();
  if (error) {
    console.error(error);
    return null;
  }
  return row.id as string;
}
