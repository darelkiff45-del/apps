"use client";

import Link from "next/link";
import { PricingTable } from "@/components/PricingTable";
import { useProfile } from "@/lib/client";

export default function TarifsPage() {
  const profile = useProfile();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">✦</span>
          Créateur Digital
        </Link>
        <Link href={profile ? "/studio" : "/connexion"} className="btn-ghost">
          {profile ? "Mon studio" : "Se connecter"}
        </Link>
      </header>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-center text-4xl font-black">Des formules simples, en FCFA</h1>
        <p className="mx-auto mt-3 mb-10 max-w-xl text-center text-gray-500">
          Paie par Mobile Money ou par carte. Commence gratuitement avec 5 crédits chaque mois.
        </p>
        <PricingTable profile={profile} />
      </section>
    </div>
  );
}
