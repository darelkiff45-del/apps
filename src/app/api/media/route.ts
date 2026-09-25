import { z } from "zod";
import { uploadDataUrl } from "@/lib/images";
import { handler } from "@/lib/route";

/** Importe une image (éditeur visuel) ou un audio WAV (voix de l'avatar) dans le stockage public, pour qu'elle s'affiche aussi une fois la page publiée. */
export const POST = handler(
  z.object({ dataUrl: z.string().regex(/^data:(image\/(png|jpeg|webp)|audio\/wav);base64,/).max(8_000_000) }),
  async ({ dataUrl }, { user }) => ({ url: await uploadDataUrl(user.id, dataUrl) }),
);
