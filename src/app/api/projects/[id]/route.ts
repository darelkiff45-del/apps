import { NextResponse } from "next/server";
import { z } from "zod";
import { getProfile, requireUser } from "@/lib/account";
import { withBadge } from "@/lib/publish";
import { AIError } from "@/lib/ai";
import { errorResponse } from "@/lib/route";
import { createAdmin, createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

/** Projet complet + liens de téléchargement temporaires de ses fichiers. */
export async function GET(_: Request, { params }: Ctx) {
  try {
    await requireUser();
    const { id } = await params;
    const supabase = await createClient();
    const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
    if (!project) throw new AIError("Projet introuvable.", 404);
    const files = (project.files as string[]) || [];
    const signed = files.length
      ? (await createAdmin().storage.from("projects").createSignedUrls(files, 3600)).data || []
      : [];
    return NextResponse.json({
      project,
      files: signed.map((f) => ({ path: f.path, url: f.signedUrl, name: f.path?.split("/").pop() })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

const Patch = z.object({ title: z.string().max(200).optional(), data: z.unknown().optional() });

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = Patch.safeParse(await req.json().catch(() => null));
    if (!body.success) throw new AIError("Requête invalide.", 400);
    const supabase = await createClient();
    const { error } = await supabase
      .from("projects")
      .update({ ...body.data, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;

    // Si la page est publiée, la version en ligne est mise à jour avec les modifications.
    const html = (body.data.data as { html?: unknown } | undefined)?.html;
    let republished = false;
    if (typeof html === "string") {
      const admin = createAdmin();
      const { data: site } = await admin.from("sites").select("id").eq("project_id", id).eq("user_id", user.id).maybeSingle();
      if (site) {
        const profile = await getProfile(user.id);
        await admin
          .from("sites")
          .update({ html: profile.plan === "free" ? withBadge(html) : html, updated_at: new Date().toISOString() })
          .eq("id", site.id);
        republished = true;
      }
    }
    return NextResponse.json({ ok: true, republished });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    await requireUser();
    const { id } = await params;
    const supabase = await createClient();
    const { data: project } = await supabase.from("projects").select("files").eq("id", id).single();
    if (!project) throw new AIError("Projet introuvable.", 404);
    const files = (project.files as string[]) || [];
    if (files.length) await createAdmin().storage.from("projects").remove(files);
    await supabase.from("projects").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
