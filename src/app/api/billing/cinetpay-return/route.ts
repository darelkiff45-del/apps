import { NextResponse } from "next/server";
import { appUrl } from "@/lib/billing";

/** CinetPay renvoie le client ici (en GET ou POST) : on le redirige vers son compte, qui vérifie le paiement. */
async function back(req: Request) {
  const ref = new URL(req.url).searchParams.get("ref") || "";
  return NextResponse.redirect(`${appUrl()}/studio/compte?ref=${encodeURIComponent(ref)}`, 303);
}

export const GET = back;
export const POST = back;
