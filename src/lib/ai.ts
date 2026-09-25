import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

export class AIError extends Error {
  constructor(
    message: string,
    public status = 500,
  ) {
    super(message);
  }
}

type RunOptions = {
  system: string;
  prompt: string;
  effort?: "low" | "medium" | "high";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  format?: any;
};

async function run({ system, prompt, effort = "medium", format }: RunOptions) {
  try {
    const stream = getClient().beta.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      thinking: { type: "adaptive" },
      output_config: { effort, ...(format ? { format } : {}) },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      messages: [{ role: "user", content: prompt }],
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      throw new AIError("La demande a été refusée par l'IA. Reformule ton sujet.", 422);
    }
    if (message.stop_reason === "max_tokens") {
      throw new AIError("La réponse est trop longue. Réduis la taille demandée.", 422);
    }
    return message.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("");
  } catch (err) {
    if (err instanceof AIError) throw err;
    if (err instanceof Anthropic.AuthenticationError) {
      throw new AIError(
        "Clé API Anthropic manquante ou invalide. Ajoute ANTHROPIC_API_KEY dans .env.local.",
        401,
      );
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new AIError("Trop de requêtes, réessaie dans un instant.", 429);
    }
    if (err instanceof Anthropic.APIError) {
      throw new AIError(`Erreur de l'API Claude : ${err.message}`, 502);
    }
    if (err instanceof Error && /api key|apiKey|authentication/i.test(err.message)) {
      throw new AIError(
        "Clé API Anthropic manquante. Ajoute ANTHROPIC_API_KEY dans .env.local.",
        401,
      );
    }
    throw err;
  }
}

/** Génère une réponse JSON validée par un schéma Zod. */
export async function generateJSON<T extends z.ZodType>(
  schema: T,
  system: string,
  prompt: string,
  effort?: RunOptions["effort"],
): Promise<z.infer<T>> {
  const text = await run({ system, prompt, effort, format: zodOutputFormat(schema) });
  try {
    return schema.parse(JSON.parse(text));
  } catch {
    throw new AIError("Réponse de l'IA illisible, relance la génération.", 502);
  }
}

/** Génère un document HTML complet et autonome. */
export async function generateHTML(system: string, prompt: string): Promise<string> {
  const text = await run({
    system:
      system +
      "\n\nRéponds UNIQUEMENT avec un document HTML complet (<!DOCTYPE html> … </html>), " +
      "autonome : CSS dans une balise <style>, aucune dépendance sauf Google Fonts et, si utile, " +
      "des images d'illustration depuis https://images.unsplash.com. Aucun texte avant ou après le HTML, " +
      "pas de bloc de code markdown.",
    prompt,
    effort: "medium",
  });
  const start = text.search(/<!DOCTYPE html>|<html/i);
  const end = text.lastIndexOf("</html>");
  if (start === -1 || end === -1) {
    throw new AIError("Le HTML généré est incomplet, relance la génération.", 502);
  }
  return text.slice(start, end + "</html>".length);
}
