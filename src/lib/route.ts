import "server-only";
import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createProject, requireUser, withCredits, type ProjectType } from "./account";
import { AIError } from "./ai";
import type { CostKind } from "./plans";

export function errorResponse(err: unknown) {
  if (err instanceof AIError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ error: "Erreur inattendue du serveur." }, { status: 500 });
}

type Options<I, R> = {
  /** Crédits débités (remboursés si la génération échoue). */
  cost?: CostKind;
  /** Sauvegarde automatique du résultat dans « Mes projets ». */
  save?: (input: I, result: R) => { type: ProjectType; title: string; data: unknown };
};

/** Enveloppe commune des routes API : connexion obligatoire, validation, crédits, sauvegarde, erreurs lisibles. */
export function handler<T extends z.ZodType, R>(
  input: T,
  fn: (data: z.infer<T>, ctx: { user: User }) => Promise<R>,
  options: Options<z.infer<T>, R> = {},
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
      const user = await requireUser();
      const run = () => fn(parsed.data, { user });
      const result = options.cost ? await withCredits(user.id, options.cost, run) : await run();
      if (options.save) {
        const p = options.save(parsed.data, result);
        const projectId = await createProject(user.id, p.type, p.title, p.data);
        return NextResponse.json({ ...result, projectId });
      }
      return NextResponse.json(result);
    } catch (err) {
      return errorResponse(err);
    }
  };
}
