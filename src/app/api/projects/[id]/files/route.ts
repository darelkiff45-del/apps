import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/account";
import { AIError } from "@/lib/ai";
import { errorResponse } from "@/lib/route";
import { createAdmin, createClient } from "@/lib/supabase/server";

const Body = z.object({
  name: z.string().regex(/^[\w.-]{1,100}$/),
  dataUrl: z.string().regex(/^data:(image\/(png|jpeg)|application\/pdf);base64,/).max(15_000_000),
});

/** Ajoute un fichier (PNG d'un mockup, PDF…) au stockage cloud d'un projet. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = Body.safeParse(await req.json().catch(() => null));
    if (!body.success) throw new AIError("Fichier invalide.", 400);

    const supabase = await createClient();
    const { data: project } = await supabase.from("projects").select("files").eq("id", id).single();
    if (!project) throw new AIError("Projet introuvable.", 404);

    const [meta, base64] = body.data.dataUrl.split(",");
    const contentType = meta.slice(5, meta.indexOf(";"));
    const path = `${user.id}/${id}/${body.data.name}`;
    const admin = createAdmin();
    const { error } = await admin.storage
      .from("projects")
      .upload(path, Buffer.from(base64, "base64"), { contentType, upsert: true });
    if (error) throw new AIError("Échec de l'envoi du fichier.", 502);

    const files = Array.from(new Set([...((project.files as string[]) || []), path]));
    await supabase.from("projects").update({ files, updated_at: new Date().toISOString() }).eq("id", id);
    const { data: signed } = await admin.storage.from("projects").createSignedUrl(path, 3600);
    return NextResponse.json({ path, url: signed?.signedUrl });
  } catch (err) {
    return errorResponse(err);
  }
}
