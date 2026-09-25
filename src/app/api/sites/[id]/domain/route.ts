import { NextResponse } from "next/server";
import { getProfile, requireUser } from "@/lib/account";
import { AIError } from "@/lib/ai";
import { PLANS } from "@/lib/plans";
import { DOMAIN_RE, addDomain, domainStatus, removeDomain } from "@/lib/publish";
import { errorResponse } from "@/lib/route";
import { createAdmin } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

async function ownedSite(userId: string, id: string) {
  const { data } = await createAdmin().from("sites").select("id, custom_domain").eq("id", id).eq("user_id", userId).single();
  if (!data) throw new AIError("Page introuvable.", 404);
  return data;
}

/** État DNS du domaine personnalisé. */
export async function GET(_: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const site = await ownedSite(user.id, (await params).id);
    if (!site.custom_domain) return NextResponse.json({ domain: null });
    return NextResponse.json({ domain: site.custom_domain, ...(await domainStatus(site.custom_domain)) });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Branche un domaine personnalisé (formule Business). */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const site = await ownedSite(user.id, (await params).id);
    const profile = await getProfile(user.id);
    if (!PLANS[profile.plan].customDomain) throw new AIError("Les domaines personnalisés sont inclus dans la formule Business.", 402);

    const body = await req.json().catch(() => ({}));
    const domain = String(body.domain || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!DOMAIN_RE.test(domain)) throw new AIError("Nom de domaine invalide (ex. www.mondomaine.com).", 400);
    const pages = process.env.NEXT_PUBLIC_PAGES_DOMAIN;
    if (pages && (domain === pages || domain.endsWith(`.${pages}`))) throw new AIError("Utilise ton propre domaine.", 400);

    const admin = createAdmin();
    const { data: taken } = await admin.from("sites").select("id").eq("custom_domain", domain).maybeSingle();
    if (taken && taken.id !== site.id) throw new AIError("Ce domaine est déjà utilisé.", 409);

    await addDomain(domain);
    if (site.custom_domain && site.custom_domain !== domain) await removeDomain(site.custom_domain).catch(() => undefined);
    await admin.from("sites").update({ custom_domain: domain }).eq("id", site.id);
    return NextResponse.json({ domain, ...(await domainStatus(domain)) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const site = await ownedSite(user.id, (await params).id);
    if (site.custom_domain) {
      await removeDomain(site.custom_domain).catch(() => undefined);
      await createAdmin().from("sites").update({ custom_domain: null }).eq("id", site.id);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
