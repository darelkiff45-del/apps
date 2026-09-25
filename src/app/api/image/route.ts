import { z } from "zod";
import { IMAGE_SIZES, generateImage } from "@/lib/images";
import { handler } from "@/lib/route";

export const maxDuration = 120;

const Input = z.object({
  prompt: z.string().min(3).max(1000),
  size: z.enum(IMAGE_SIZES).default("landscape_4_3"),
});

/** Génère une image IA (éditeur visuel, couverture). */
export const POST = handler(Input, async ({ prompt, size }, { user }) => ({ url: await generateImage(user.id, prompt, size) }), {
  cost: "image",
});
