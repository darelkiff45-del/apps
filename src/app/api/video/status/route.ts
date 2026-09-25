import { z } from "zod";
import { AIError } from "@/lib/ai";
import { hfStatus } from "@/lib/higgsfield";
import { COSTS } from "@/lib/plans";
import { handler } from "@/lib/route";
import { createAdmin } from "@/lib/supabase/server";
import type { RenderedScene } from "../render/route";

export const maxDuration = 120;

const Input = z.object({ projectId: z.string().uuid() });

type VideoData = { script?: unknown; format?: string; scenes: RenderedScene[] };

/**
 * Suit la production de chaque scène. Les clips terminés sont copiés dans le stockage cloud
 * (les liens Higgsfield sont temporaires) ; les scènes échouées sont remboursées une seule fois.
 */
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
  if (!Array.isArray(data?.scenes)) throw new AIError("Cette vidéo a été créée avec une ancienne version.", 400);

  const files = new Set<string>((project.files as string[]) || []);
  let changed = false;

  const scenes = await Promise.all(
    data.scenes.map(async (scene, i): Promise<RenderedScene> => {
      if (scene.storagePath || scene.status === "failed" || scene.status === "nsfw" || !scene.requestId) return scene;
      try {
        const s = await hfStatus(scene.requestId);
        if (s.status === "completed" && s.videoUrl) {
          const video = await fetch(s.videoUrl);
          if (!video.ok) return scene;
          const path = `${user.id}/${projectId}/scene-${i + 1}.mp4`;
          const { error } = await admin.storage
            .from("projects")
            .upload(path, await video.arrayBuffer(), { contentType: "video/mp4", upsert: true });
          if (error) return scene;
          files.add(path);
          changed = true;
          return { ...scene, status: "completed", storagePath: path };
        }
        if (s.status === "failed" || s.status === "nsfw") {
          changed = true;
          if (!scene.refunded) await admin.rpc("refund_credits", { p_user: user.id, p_amount: COSTS["video-render"], p_kind: "video-render" });
          return { ...scene, status: s.status, refunded: true, error: s.status === "nsfw" ? "Refusé par la modération" : "Échec du rendu" };
        }
        if (s.status !== scene.status) changed = true;
        return { ...scene, status: s.status };
      } catch {
        return scene; // nouvel essai au prochain passage
      }
    }),
  );

  if (changed) {
    await admin
      .from("projects")
      .update({ data: { ...data, scenes }, files: [...files], updated_at: new Date().toISOString() })
      .eq("id", projectId);
  }

  const paths = scenes.flatMap((s) => (s.storagePath ? [s.storagePath] : []));
  const signed = paths.length ? (await admin.storage.from("projects").createSignedUrls(paths, 3600)).data || [] : [];
  const urlOf = new Map(signed.map((x) => [x.path, x.signedUrl]));

  const done = scenes.every((s) => s.storagePath || s.status === "failed" || s.status === "nsfw");
  return {
    done,
    scenes: scenes.map((s) => ({
      label: s.label,
      mode: s.mode,
      status: s.storagePath ? "completed" : s.status,
      onScreenText: s.onScreenText,
      voiceover: s.voiceover,
      imageUrl: s.imageUrl,
      url: s.storagePath ? urlOf.get(s.storagePath) : undefined,
      error: s.error,
    })),
  };
});
