"use client";

import { toPng } from "html-to-image";
import { useEffect, useRef, useState } from "react";
import { download } from "@/lib/client";
import { Cover, type CoverDesign } from "./Cover";

function Book3D({ design, width = 220 }: { design: CoverDesign; width?: number }) {
  return (
    <div style={{ perspective: 1400 }}>
      <div
        className="relative"
        style={{
          transform: "rotateY(-22deg) rotateX(3deg)",
          borderRadius: "2px 6px 6px 2px",
          // Tranche des pages + ombre portée
          boxShadow:
            "3px 3px 0 -1px #fff, 5px 5px 0 -1px #e5e7eb, 7px 7px 0 -1px #fff, 9px 9px 0 -1px #e5e7eb, 11px 11px 0 -1px #fff, 30px 35px 50px rgba(0,0,0,.35)",
        }}
      >
        <div className="overflow-hidden" style={{ borderRadius: "2px 6px 6px 2px" }}>
          <Cover design={design} width={width} />
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[7%] bg-gradient-to-r from-black/35 via-white/10 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20" />
      </div>
    </div>
  );
}

function Tablet({ design, width = 230 }: { design: CoverDesign; width?: number }) {
  return (
    <div className="rounded-[22px] bg-gray-900 p-[10px] shadow-2xl" style={{ boxShadow: "0 30px 60px rgba(0,0,0,.35)" }}>
      <div className="overflow-hidden rounded-[12px]">
        <Cover design={design} width={width} />
      </div>
    </div>
  );
}

function Phone({ design, width = 130 }: { design: CoverDesign; width?: number }) {
  return (
    <div className="relative rounded-[26px] bg-gray-900 p-[7px]" style={{ boxShadow: "0 25px 50px rgba(0,0,0,.4)" }}>
      <div className="absolute top-[12px] left-1/2 z-10 h-[10px] w-[38%] -translate-x-1/2 rounded-full bg-gray-900" />
      <div className="overflow-hidden rounded-[20px]" style={{ height: width * 2.05, background: design.background }}>
        <div className="flex h-full items-center">
          <Cover design={design} width={width} />
        </div>
      </div>
    </div>
  );
}

function Bundle({ design }: { design: CoverDesign }) {
  return (
    <div className="relative flex items-end">
      <div className="z-0 -mr-10">
        <Tablet design={design} width={200} />
      </div>
      <div className="z-10 mb-[-10px]">
        <Book3D design={design} width={170} />
      </div>
      <div className="z-20 -ml-6">
        <Phone design={design} width={100} />
      </div>
    </div>
  );
}

function Stage({ design, ratio, children }: { design: CoverDesign; ratio: "square" | "story" | "wide"; children: React.ReactNode }) {
  const size = ratio === "square" ? { width: 540, height: 540 } : ratio === "story" ? { width: 360, height: 640 } : { width: 640, height: 400 };
  return (
    <div
      className="relative flex flex-col items-center justify-center overflow-hidden"
      style={{
        ...size,
        background: `radial-gradient(circle at 30% 20%, ${design.accent}40, transparent 60%), linear-gradient(135deg, #f8fafc, #e5e7eb)`,
      }}
    >
      {children}
    </div>
  );
}

function Promo({ design, price, story }: { design: CoverDesign; price: string; story?: boolean }) {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden p-8 text-center"
      style={{ background: `linear-gradient(160deg, ${design.background}, ${design.backgroundEnd})`, color: design.text }}
    >
      <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 50% 55%, ${design.accent}, transparent 55%)` }} />
      <p className="relative px-2 text-[24px] leading-tight font-black break-words" style={{ fontFamily: `'${design.fontFamily}', sans-serif` }}>
        {design.headlines[0] || design.title}
      </p>
      <div className="relative">
        <Book3D design={design} width={story ? 170 : 150} />
      </div>
      <div className="relative flex flex-col items-center gap-2">
        {design.headlines[1] && <p className="text-sm opacity-90">{design.headlines[1]}</p>}
        <span className="rounded-full px-5 py-2 text-sm font-extrabold" style={{ background: design.accent, color: design.background }}>
          {price ? `Disponible — ${price}` : "Disponible maintenant"}
        </span>
      </div>
    </div>
  );
}

const SCENES = [
  { id: "book", label: "Livre 3D", ratio: "square" as const },
  { id: "tablet", label: "Tablette", ratio: "square" as const },
  { id: "phone", label: "Smartphone", ratio: "square" as const },
  { id: "bundle", label: "Pack complet", ratio: "wide" as const },
  { id: "post", label: "Visuel pub (post carré)", ratio: "square" as const },
  { id: "story", label: "Visuel pub (story 9:16)", ratio: "story" as const },
  { id: "cover", label: "Couverture seule", ratio: "square" as const },
];

export type SceneId = (typeof SCENES)[number]["id"];

function Scene({ id, design, price }: { id: SceneId; design: CoverDesign; price: string }) {
  switch (id) {
    case "book":
      return <Book3D design={design} width={250} />;
    case "tablet":
      return <Tablet design={design} width={250} />;
    case "phone":
      return <Phone design={design} width={200} />;
    case "bundle":
      return <Bundle design={design} />;
    case "post":
      return <Promo design={design} price={price} />;
    case "story":
      return <Promo design={design} price={price} story />;
    case "cover":
      return <Cover design={design} width={330} />;
  }
}

/** Réduit l'aperçu pour qu'il tienne dans la carte, sans toucher à l'export (taille réelle). */
function FitBox({ width, children }: { width: number; children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (!outer.current) return;
    const obs = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / width)));
    obs.observe(outer.current);
    return () => obs.disconnect();
  }, [width]);
  return (
    <div ref={outer} className="flex w-full justify-center">
      <div style={{ zoom: scale }}>{children}</div>
    </div>
  );
}

const STAGE_WIDTH = { square: 540, story: 360, wide: 640 };

export async function exportNode(node: HTMLElement, pixelRatio = 2) {
  return toPng(node, { pixelRatio, cacheBust: true });
}

function SceneCard({
  scene,
  design,
  price,
  filename,
  onUseForSales,
  onSaveCloud,
}: {
  scene: (typeof SCENES)[number];
  design: CoverDesign;
  price: string;
  filename: string;
  onUseForSales?: (dataUrl: string) => void;
  onSaveCloud?: (name: string, dataUrl: string) => Promise<void>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const full = scene.id === "post" || scene.id === "story";

  const exportPng = async (pixelRatio: number) => {
    if (!ref.current) return null;
    setBusy(true);
    try {
      return await exportNode(ref.current, pixelRatio);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold">{scene.label}</span>
        <div className="flex gap-2">
          {onUseForSales && !full && (
            <button
              className="btn-ghost px-2 py-1 text-xs"
              disabled={busy}
              onClick={async () => {
                const url = await exportPng(1);
                if (url) onUseForSales(url);
              }}
            >
              Utiliser sur la page de vente
            </button>
          )}
          {onSaveCloud && (
            <button
              className="btn-ghost px-2 py-1 text-xs"
              disabled={busy}
              title="Enregistrer dans le cloud"
              onClick={async () => {
                const url = await exportPng(2);
                if (url) await onSaveCloud(`${filename}-${scene.id}.png`, url).catch((e) => alert(e.message));
              }}
            >
              ☁️
            </button>
          )}
          <button
            className="btn-primary px-2 py-1 text-xs"
            disabled={busy}
            onClick={async () => {
              const url = await exportPng(2);
              if (url) download(`${filename}-${scene.id}.png`, await (await fetch(url)).blob());
            }}
          >
            {busy ? "…" : "PNG ⬇"}
          </button>
        </div>
      </div>
      <FitBox width={STAGE_WIDTH[scene.ratio]}>
        <div ref={ref}>
          <Stage design={design} ratio={scene.ratio}>
            <Scene id={scene.id} design={design} price={price} />
          </Stage>
        </div>
      </FitBox>
    </div>
  );
}

export function MockupGallery({
  design,
  price,
  filename,
  onUseForSales,
  onSaveCloud,
}: {
  design: CoverDesign;
  price: string;
  filename: string;
  onUseForSales?: (dataUrl: string) => void;
  onSaveCloud?: (name: string, dataUrl: string) => Promise<void>;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {SCENES.map((s) => (
        <SceneCard key={s.id} scene={s} design={design} price={price} filename={filename} onUseForSales={onUseForSales} onSaveCloud={onSaveCloud} />
      ))}
    </div>
  );
}
