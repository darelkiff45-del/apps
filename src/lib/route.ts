import "server-only";
import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createProject, refundCredits, requireUser, withCredits, type ProjectType } from "./account";
import { AIError } from "./ai";
import { COSTS, type CostKind } from "./plans";

export function errorResponse(err: unknown) {
  if (err instanceof AIError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ error: "Erreur inattendue du serveur." }, { status: 500 });
}

type Cost = { kind: CostKind; amount: number };

export type Ctx = {
  user: User;
  /** Rembourse une partie des crédits (ex. une variante sur trois a échoué). */
  refund: (amount: number) => Promise<void>;
};

type Options<I, R> = {
  /** Crédits débités (remboursés si la génération échoue) : un type fixe, ou calculé selon la demande. */
  cost?: CostKind | ((input: I) => Cost);
  /** Sauvegarde automatique du résultat dans « Mes projets ». */
  save?: (input: I, result: R) => { type: ProjectType; title: string; data: unknown };
};

/** Enveloppe commune des routes API : connexion obligatoire, validation, crédits, sauvegarde, erreurs lisibles. */
export function handler<T extends z.ZodType, R>(
  input: T,
  fn: (data: z.infer<T>, ctx: Ctx) => Promise<R>,
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
      const cost: Cost | null = !options.cost
        ? null
        : typeof options.cost === "string"
          ? { kind: options.cost, amount: COSTS[options.cost] }
          : options.cost(parsed.data);
      const ctx: Ctx = { user, refund: async (amount) => (cost ? refundCredits(user.id, cost.kind, amount) : undefined) };
      const run = () => fn(parsed.data, ctx);
      const result = cost ? await withCredits(user.id, cost.kind, run, cost.amount) : await run();
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
