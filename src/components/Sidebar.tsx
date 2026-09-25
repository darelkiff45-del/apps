"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useProfile } from "@/lib/client";
import { MODULES } from "@/lib/modules";
import { PLANS } from "@/lib/plans";
import { createClient } from "@/lib/supabase/browser";

const LINKS = [
  { href: "/studio", label: "Tableau de bord", icon: "🏠" },
  ...MODULES,
  { href: "/studio/projets", label: "Mes projets", icon: "📁" },
  { href: "/studio/compte", label: "Mon compte", icon: "👤" },
];

export function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const profile = useProfile();

  const logout = async () => {
    await createClient().auth.signOut();
    router.push("/connexion");
    router.refresh();
  };

  return (
    <aside className="border-b border-gray-100 bg-white md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col md:border-r md:border-b-0">
      <Link href="/" className="flex items-center gap-2 px-5 py-4 text-lg font-extrabold">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">✦</span>
        Créateur Digital
      </Link>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
        {LINKS.map((l) => {
          const active = l.href === "/studio" ? path === l.href : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden p-3 md:mt-auto md:block">
        {profile && (
          <div className="rounded-xl bg-gray-50 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-brand-700">{PLANS[profile.plan].name}</span>
              <span className="text-gray-500">{profile.credits} crédits</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-brand-600"
                style={{ width: `${Math.min(100, (profile.credits / PLANS[profile.plan].credits) * 100)}%` }}
              />
            </div>
            {profile.plan !== "business" && (
              <Link href="/tarifs" className="btn-primary mt-3 w-full py-1.5 text-xs">
                Passer à la formule supérieure
              </Link>
            )}
            <div className="mt-2 truncate text-center text-[11px] text-gray-400">{profile.email}</div>
            <button className="mt-1 w-full text-xs text-gray-500 hover:text-gray-800" onClick={logout}>
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
