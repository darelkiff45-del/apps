import { NextResponse } from "next/server";
import { requireUser } from "@/lib/account";
import { AIError } from "@/lib/ai";
import { removeDomain } from "@/lib/publish";
import { errorResponse } from "@/lib/route";
import { createAdmin } from "@/lib/supabase/server";

/** Dépublie une page (et détache son domaine personnalisé). */
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const admin = createAdmin();
    const { data: site } = await admin.from("sites").select("custom_domain").eq("id", id).eq("user_id", user.id).single();
    if (!site) throw new AIError("Page introuvable.", 404);
    if (site.custom_domain) await removeDomain(site.custom_domain).catch(() => undefined);
    await admin.from("sites").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
