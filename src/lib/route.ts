import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AIError } from "./ai";

/** Enveloppe commune des routes API : validation d'entrée + erreurs lisibles en français. */
export function handler<T extends z.ZodType>(
  input: T,
  fn: (data: z.infer<T>) => Promise<unknown>,
) {
  return async (req: Request) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    const parsed = input.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Champs invalides : " + parsed.error.issues.map((i) => i.path.join(".")).join(", ") },
        { status: 400 },
      );
    }
    try {
      return NextResponse.json(await fn(parsed.data));
    } catch (err) {
      if (err instanceof AIError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      console.error(err);
      return NextResponse.json({ error: "Erreur inattendue du serveur." }, { status: 500 });
    }
  };
}
