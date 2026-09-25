import { z } from "zod";
import { videoStatus } from "@/lib/heygen";
import { handler } from "@/lib/route";

const Input = z.object({ videoId: z.string().min(1) });

export const POST = handler(Input, async ({ videoId }) => videoStatus(videoId));
