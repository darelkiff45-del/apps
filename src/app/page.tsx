import Link from "next/link";
import { Roadmap } from "@/components/Roadmap";
import { MODULES } from "@/lib/modules";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2 text-lg font-extrabold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">✦</span>
          Créateur Digital
        </div>
        <Link href="/studio" className="btn-primary">
          Ouvrir le studio
        </Link>
      </header>

      <section className="mx-auto max-w-4xl px-4 pt-12 pb-16 text-center md:pt-20">
        <span className="rounded-full bg-brand-100 px-4 py-1 text-xs font-bold text-brand-700">Propulsé par l&apos;IA</span>
        <h1 className="mt-5 text-4xl leading-tight font-black md:text-6xl">
          Crée ton produit digital <span className="text-brand-600">et tout son marketing</span> en une après-midi.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">
          Ebooks, templates, mockups, pages de vente, sites vitrines et vidéos pub UGC : une seule fiche produit, et l&apos;IA
          fabrique le reste.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/studio" className="btn-primary px-6 py-3 text-base">
            Commencer gratuitement →
          </Link>
          <a href="#roadmap" className="btn-ghost px-6 py-3 text-base">
            Voir la feuille de route
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <Link key={m.href} href={m.href} className="card transition hover:-translate-y-1 hover:shadow-md">
              <div className="text-3xl">{m.icon}</div>
              <h3 className="mt-3 text-lg font-bold">{m.label}</h3>
              <p className="mt-1 text-sm text-gray-500">{m.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-black">Comment ça marche</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              ["1", "Décris ton produit", "Niche, client idéal, promesse, prix."],
              ["2", "Génère le produit", "Ebook ou template prêt à vendre, en PDF."],
              ["3", "Habille-le", "Couverture, mockups 3D et visuels pub."],
              ["4", "Vends-le", "Page de vente, site et vidéos UGC."],
            ].map(([n, t, d]) => (
              <div key={n} className="text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-600 text-lg font-black text-white">{n}</div>
                <h3 className="mt-3 font-bold">{t}</h3>
                <p className="text-sm text-gray-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roadmap" className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-3xl font-black">Feuille de route en 3 versions</h2>
        <p className="mx-auto mt-2 mb-10 max-w-xl text-center text-gray-500">Du studio de création à la machine de vente automatisée.</p>
        <Roadmap />
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">© {new Date().getFullYear()} Créateur Digital</footer>
    </div>
  );
}
