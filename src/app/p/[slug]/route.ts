import { servePage } from "@/lib/publish";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return servePage({ slug: slug.toLowerCase() });
}
