import { NextResponse } from "next/server";
import { z } from "zod";
import { getProfile, requireUser } from "@/lib/account";
import { AIError } from "@/lib/ai";
import { PLANS } from "@/lib/plans";
import { RESERVED_SLUGS, SLUG_RE, pageUrl, withBadge } from "@/lib/publish";
import { errorResponse, handler } from "@/lib/route";
import { createAdmin, createClient } from "@/lib/supabase/server";

/** Pages publiées de l'utilisateur. */
export async function GET() {
  try {
    await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sites")
      .select("id, project_id, title, slug, custom_domain, views, published_at, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ sites: (data || []).map((s) => ({ ...s, url: pageUrl(s.slug) })) });
  } catch (err) {
    return errorResponse(err);
  }
}

const Input = z.object({
  projectId: z.string().uuid(),
  slug: z.string().toLowerCase().regex(SLUG_RE, "Adresse : 3 à 40 caractères, lettres minuscules, chiffres et tirets."),
});

/** Publie (ou republie) un site vitrine ou une page de vente. */
export const POST = handler(Input, async ({ projectId, slug }, { user }) => {
  if (RESERVED_SLUGS.has(slug)) throw new AIError("Cette adresse est réservée, choisis-en une autre.", 400);
  const admin = createAdmin();

  const { data: project } = await admin
    .from("projects")
    .select("id, type, title, data")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!project || !["site", "sales-page"].includes(project.type)) throw new AIError("Seuls les sites et pages de vente se publient.", 400);
  const html = (project.data as { html?: string })?.html;
  if (!html) throw new AIError("Ce projet n'a pas de page à publier.", 400);

  const profile = await getProfile(user.id);
  const content = profile.plan === "free" ? withBadge(html) : html;

  const { data: existing } = await admin.from("sites").select("id").eq("project_id", projectId).eq("user_id", user.id).maybeSingle();
  const { data: taken } = await admin.from("sites").select("id").eq("slug", slug).maybeSingle();
  if (taken && taken.id !== existing?.id) throw new AIError("Cette adresse est déjà prise.", 409);

  if (existing) {
    await admin
      .from("sites")
      .update({ slug, html: content, title: project.title, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    return { id: existing.id, url: pageUrl(slug) };
  }

  const { count } = await admin.from("sites").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  const limit = PLANS[profile.plan].pages;
  if ((count || 0) >= limit) {
    throw new AIError(`Ta formule permet ${limit} page${limit > 1 ? "s" : ""} publiée${limit > 1 ? "s" : ""}. Passe à une formule supérieure ou dépublie une page.`, 402);
  }
  const { data: site, error } = await admin
    .from("sites")
    .insert({ user_id: user.id, project_id: projectId, slug, html: content, title: project.title })
    .select("id")
    .single();
  if (error) throw new AIError("Publication impossible.", 500);
  return { id: site.id, url: pageUrl(slug) };
});
