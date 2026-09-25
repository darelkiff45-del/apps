import { NextResponse } from "next/server";
import { verifyCinetpay } from "@/lib/billing";

/** Notification serveur CinetPay. Le statut est toujours revérifié via leur API. */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const reference = form?.get("cpm_trans_id")?.toString();
  if (reference) {
    try {
      await verifyCinetpay(reference);
    } catch (err) {
      console.error("CinetPay webhook", err);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}

// CinetPay teste la disponibilité de l'URL avec un GET.
export async function GET() {
  return NextResponse.json({ ok: true });
}
