import { z } from "zod";
import { AIError } from "@/lib/ai";
import { videoStatus } from "@/lib/heygen";
import { COSTS } from "@/lib/plans";
import { handler } from "@/lib/route";
import { createAdmin } from "@/lib/supabase/server";

const Input = z.object({ projectId: z.string().uuid() });

type VideoData = { videoId: string; status?: string; storagePath?: string; refunded?: boolean; error?: string };

/** Suit le rendu HeyGen ; une fois terminé, copie la vidéo dans le stockage cloud (les liens HeyGen expirent). */
export const POST = handler(Input, async ({ projectId }, { user }) => {
  const admin = createAdmin();
  const { data: project } = await admin
    .from("projects")
    .select("id, data, files")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .eq("type", "video")
    .single();
  if (!project) throw new AIError("Vidéo introuvable.", 404);
  const data = project.data as VideoData;

  if (data.storagePath) {
    const { data: signed } = await admin.storage.from("projects").createSignedUrl(data.storagePath, 3600);
    return { status: "completed", url: signed?.signedUrl };
  }
  if (data.status === "failed") return { status: "failed", error: data.error };

  const s = await videoStatus(data.videoId);

  if (s.status === "failed") {
    const next: VideoData = { ...data, status: "failed", error: s.error?.message || "Échec du rendu" };
    if (!data.refunded) {
      await admin.rpc("refund_credits", { p_user: user.id, p_amount: COSTS["video-render"], p_kind: "video-render" });
      next.refunded = true;
    }
    await admin.from("projects").update({ data: next, updated_at: new Date().toISOString() }).eq("id", projectId);
    return { status: "failed", error: next.error };
  }

  if (s.status === "completed" && s.video_url) {
    const path = `${user.id}/${projectId}/video.mp4`;
    const video = await fetch(s.video_url);
    if (video.ok) {
      const { error } = await admin.storage
        .from("projects")
        .upload(path, await video.arrayBuffer(), { contentType: "video/mp4", upsert: true });
      if (!error) {
        await admin
          .from("projects")
          .update({
            data: { ...data, status: "completed", storagePath: path },
            files: [...((project.files as string[]) || []), path],
            updated_at: new Date().toISOString(),
          })
          .eq("id", projectId);
        const { data: signed } = await admin.storage.from("projects").createSignedUrl(path, 3600);
        return { status: "completed", url: signed?.signedUrl };
      }
    }
    // Copie impossible : on renvoie le lien HeyGen (temporaire).
    return { status: "completed", url: s.video_url };
  }

  return { status: s.status };
});
