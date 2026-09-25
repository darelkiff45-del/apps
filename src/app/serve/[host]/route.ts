import { servePage } from "@/lib/publish";

/** Pages publiées sur un sous-domaine ou un domaine personnalisé (réécriture faite par le middleware). */
export async function GET(_: Request, { params }: { params: Promise<{ host: string }> }) {
  const { host } = await params;
  return servePage({ host: decodeURIComponent(host) });
}
