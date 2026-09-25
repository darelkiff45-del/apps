"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/lib/modules";

const LINKS = [
  { href: "/studio", label: "Tableau de bord", icon: "🏠" },
  ...MODULES,
  { href: "/studio/projets", label: "Mes projets", icon: "📁" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="border-b border-gray-100 bg-white md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-r md:border-b-0">
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
    </aside>
  );
}
