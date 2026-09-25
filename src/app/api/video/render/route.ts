import { z } from "zod";
import { createVideo } from "@/lib/heygen";
import { handler } from "@/lib/route";

const Input = z.object({
  avatarId: z.string().min(1),
  voiceId: z.string().min(1),
  format: z.enum(["vertical", "square", "horizontal"]).default("vertical"),
  captions: z.boolean().default(true),
  scenes: z
    .array(
      z.object({
        voiceover: z.string().min(1).max(1500),
        background: z.string().regex(/^#[0-9a-fA-F]{6}$/).catch("#111827"),
      }),
    )
    .min(1)
    .max(20),
});

export const POST = handler(Input, async (data) => ({ videoId: await createVideo(data) }));
