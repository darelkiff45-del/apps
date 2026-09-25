"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, type Profile } from "@/lib/client";
import { COST_LABELS, COSTS, PLANS, type PlanId } from "@/lib/plans";

export function PricingTable({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const [choosing, setChoosing] = useState<PlanId | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pay = async (plan: PlanId, provider: "stripe" | "cinetpay") => {
    setLoading(provider);
    setError(null);
    try {
      const { url } = await api<{ url: string }>("/api/billing/checkout", { plan, provider });
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(null);
    }
  };

  const choose = (plan: PlanId) => {
    if (!profile) return router.push("/connexion?next=/tarifs");
    setChoosing(plan);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.values(PLANS).map((p) => {
          const current = profile?.plan === p.id;
          return (
            <div key={p.id} className={`card flex flex-col ${p.highlight ? "ring-2 ring-brand-500" : ""}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold">{p.name}</h3>
                {p.highlight && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700">Populaire</span>}
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black">{p.priceXof.toLocaleString("fr-FR")}</span>
                <span className="text-sm text-gray-500"> FCFA / mois</span>
              </div>
              <div className="text-xs text-gray-400">{p.priceEur}</div>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-brand-600">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {p.id === "free" ? (
                <button className="btn-ghost mt-5" onClick={() => router.push(profile ? "/studio" : "/connexion")}>
                  {profile ? "Aller au studio" : "Commencer gratuitement"}
                </button>
              ) : (
                <button className={`${p.highlight ? "btn-primary" : "btn-ghost"} mt-5`} onClick={() => choose(p.id)}>
                  {current ? "Renouveler" : `Choisir ${p.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="card mt-8">
        <h3 className="font-bold">Combien coûte chaque génération ?</h3>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(COSTS) as (keyof typeof COSTS)[]).map((k) => (
            <div key={k} className="flex justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span>{COST_LABELS[k]}</span>
              <span className="font-bold">
                {COSTS[k]} crédit{COSTS[k] > 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500">Les crédits sont remboursés automatiquement si une génération échoue. Ils se renouvellent chaque mois.</p>
      </div>

      {choosing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => !loading && setChoosing(null)}>
          <div className="card w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold">Formule {PLANS[choosing].name}</h3>
            <p className="text-sm text-gray-500">{PLANS[choosing].priceXof.toLocaleString("fr-FR")} FCFA / mois — choisis ton moyen de paiement :</p>
            <button className="btn-primary mt-4 w-full" disabled={!!loading} onClick={() => pay(choosing, "cinetpay")}>
              {loading === "cinetpay" ? "Redirection…" : "📱 Mobile Money (Orange, MTN, Moov, Wave)"}
            </button>
            <p className="mt-1 text-center text-[11px] text-gray-400">Paiement pour 30 jours, à renouveler.</p>
            <button className="btn-ghost mt-3 w-full" disabled={!!loading} onClick={() => pay(choosing, "stripe")}>
              {loading === "stripe" ? "Redirection…" : "💳 Carte bancaire"}
            </button>
            <p className="mt-1 text-center text-[11px] text-gray-400">Abonnement renouvelé automatiquement, résiliable à tout moment.</p>
            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
