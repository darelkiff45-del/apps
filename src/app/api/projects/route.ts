import { NextResponse } from "next/server";
import { z } from "zod";
import { createProject, requireUser } from "@/lib/account";
import { errorResponse, handler } from "@/lib/route";
import { createClient } from "@/lib/supabase/server";

/** Liste des projets (sans le contenu, pour rester léger). */
export async function GET() {
  try {
    await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .select("id, type, title, files, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return NextResponse.json({ projects: data });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Import d'un projet (ex. projets locaux de la V1). */
export const POST = handler(
  z.object({
    type: z.enum(["ebook", "template", "site", "sales-page", "mockup", "video"]),
    title: z.string().max(200),
    data: z.unknown(),
  }),
  async ({ type, title, data }, { user }) => ({ projectId: await createProject(user.id, type, title, data ?? {}) }),
);
