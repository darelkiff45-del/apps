"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui";
import { api, refreshProfile, type Profile } from "@/lib/client";
import { COST_LABELS, PLANS, type CostKind } from "@/lib/plans";

type Details = {
  profile: Profile;
  usage: { kind: string; credits: number; created_at: string }[];
  payments: { provider: string; plan: string; amount: number; currency: string; status: string; created_at: string }[];
};

const date = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—");

function Compte() {
  const params = useSearchParams();
  const [details, setDetails] = useState<Details | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => {
    api<Details>("/api/me?details=1").then(setDetails).catch((e) => setNotice({ ok: false, text: e.message }));
    refreshProfile();
  }, []);

  useEffect(() => {
    const ref = params.get("ref");
    if (params.get("paiement") === "ok") {
      setNotice({ ok: true, text: "Merci ! Ton paiement par carte est en cours de validation, ta formule s'active dans quelques secondes." });
      const t = setTimeout(load, 4000);
      load();
      return () => clearTimeout(t);
    }
    if (ref) {
      setNotice({ ok: true, text: "Vérification de ton paiement Mobile Money…" });
      api<{ status: string }>("/api/billing/verify", { reference: ref })
        .then(({ status }) =>
          setNotice(
            status === "paid"
              ? { ok: true, text: "✓ Paiement reçu : ta formule est active pour 30 jours !" }
              : status === "pending"
                ? { ok: true, text: "Paiement en attente de confirmation. Recharge la page dans une minute." }
                : { ok: false, text: "Le paiement n'a pas abouti. Tu n'as pas été débité." },
          ),
        )
        .catch((e) => setNotice({ ok: false, text: e.message }))
        .finally(load);
      return;
    }
    load();
  }, [params, load]);

  const portal = async () => {
    try {
      const { url } = await api<{ url: string }>("/api/billing/portal", {});
      window.location.href = url;
    } catch (e) {
      setNotice({ ok: false, text: e instanceof Error ? e.message : String(e) });
    }
  };

  const p = details?.profile;
  const plan = p ? PLANS[p.plan] : null;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader icon="👤" title="Mon compte" desc="Ta formule, tes crédits et tes paiements." />
      {notice && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${notice.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{notice.text}</div>
      )}
      {!p || !plan ? (
        <p className="text-sm text-gray-400">Chargement…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card">
              <div className="label">Formule</div>
              <div className="text-2xl font-black text-brand-700">{plan.name}</div>
              {p.plan !== "free" && (
                <div className="mt-1 text-xs text-gray-500">
                  {p.stripe_subscription_id ? "Renouvellement automatique le " : "Active jusqu'au "}
                  {date(p.plan_expires_at)}
                </div>
              )}
            </div>
            <div className="card">
              <div className="label">Crédits restants</div>
              <div className="text-2xl font-black">
                {p.credits} <span className="text-sm font-medium text-gray-400">/ {plan.credits}</span>
              </div>
              <div className="mt-1 text-xs text-gray-500">Renouvelés le {date(p.credits_reset_at)}</div>
            </div>
            <div className="card flex flex-col justify-center gap-2">
              <Link href="/tarifs" className="btn-primary">
                {p.plan === "free" ? "Choisir une formule" : "Changer / renouveler"}
              </Link>
              {p.stripe_customer_id && (
                <button className="btn-ghost" onClick={portal}>
                  Gérer mon abonnement carte
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="card">
              <h3 className="mb-3 font-bold">Consommation récente</h3>
              {details.usage.length === 0 ? (
                <p className="text-sm text-gray-400">Aucune génération pour l&apos;instant.</p>
              ) : (
                <ul className="divide-y divide-gray-100 text-sm">
                  {details.usage.map((u, i) => (
                    <li key={i} className="flex justify-between py-2">
                      <span>{COST_LABELS[u.kind as CostKind] || u.kind}</span>
                      <span className={u.credits < 0 ? "text-green-600" : "text-gray-600"}>
                        {u.credits < 0 ? `+${-u.credits}` : `−${u.credits}`} · {new Date(u.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="card">
              <h3 className="mb-3 font-bold">Paiements</h3>
              {details.payments.length === 0 ? (
                <p className="text-sm text-gray-400">Aucun paiement.</p>
              ) : (
                <ul className="divide-y divide-gray-100 text-sm">
                  {details.payments.map((pay, i) => (
                    <li key={i} className="flex flex-wrap justify-between gap-2 py-2">
                      <span>
                        {PLANS[pay.plan as keyof typeof PLANS]?.name || pay.plan} · {pay.provider === "stripe" ? "💳 Carte" : "📱 Mobile Money"}
                      </span>
                      <span className="text-gray-600">
                        {pay.amount.toLocaleString("fr-FR")} {pay.currency} ·{" "}
                        <span className={pay.status === "paid" ? "text-green-600" : pay.status === "failed" ? "text-red-500" : "text-amber-600"}>
                          {pay.status === "paid" ? "payé" : pay.status === "failed" ? "échoué" : "en attente"}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComptePage() {
  return (
    <Suspense>
      <Compte />
    </Suspense>
  );
}
