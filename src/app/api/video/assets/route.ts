import { NextResponse } from "next/server";
import { requireUser } from "@/lib/account";
import { listAvatars, listVoices } from "@/lib/heygen";
import { errorResponse } from "@/lib/route";

export async function GET() {
  try {
    await requireUser();
    const [avatars, voices] = await Promise.all([listAvatars(), listVoices()]);
    return NextResponse.json({ avatars, voices });
  } catch (err) {
    return errorResponse(err);
  }
}
