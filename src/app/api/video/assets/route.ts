import { NextResponse } from "next/server";
import { AIError } from "@/lib/ai";
import { listAvatars, listVoices } from "@/lib/heygen";

export async function GET() {
  try {
    const [avatars, voices] = await Promise.all([listAvatars(), listVoices()]);
    return NextResponse.json({ avatars, voices });
  } catch (err) {
    const status = err instanceof AIError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erreur inattendue.";
    return NextResponse.json({ error: message }, { status });
  }
}
