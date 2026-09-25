import "server-only";
import { AIError } from "./ai";
import type { Ctx } from "./route";

/** Directions créatives données à chaque variante pour qu'elles soient vraiment différentes. */
export const DIRECTIONS = [
  "",
  "VARIANTE B : prends une direction artistique nettement différente (autre palette, autre typographie, autre mise en page) et un autre angle de persuasion.",
  "VARIANTE C : propose une version audacieuse et originale (mise en page asymétrique, couleurs contrastées, accroches plus émotionnelles).",
];

export const VariantCount = [1, 3] as const;

/**
 * Lance `count` générations en parallèle. Les variantes qui échouent sont remboursées
 * (`unitCost` chacune) ; si toutes échouent, l'erreur est renvoyée et tout est remboursé.
 */
export async function runVariants<T>(count: number, unitCost: number, ctx: Ctx, fn: (direction: string) => Promise<T>) {
  const results = await Promise.allSettled(DIRECTIONS.slice(0, count).map((d) => fn(d)));
  const ok = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  if (!ok.length) {
    const first = results[0];
    throw first.status === "rejected" ? first.reason : new AIError("Génération impossible.", 502);
  }
  const failed = results.length - ok.length;
  if (failed) await ctx.refund(failed * unitCost);
  return ok;
}
