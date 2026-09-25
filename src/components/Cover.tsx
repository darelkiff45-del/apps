import type { CoverDesignResult } from "@/app/api/mockup/route";

export type CoverDesign = CoverDesignResult;

const PATTERNS: Record<CoverDesign["pattern"], (c: string) => string> = {
  none: () => "none",
  dots: (c) => `radial-gradient(${c}33 1.5px, transparent 1.5px) 0 0 / 18px 18px`,
  grid: (c) =>
    `linear-gradient(${c}22 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(90deg, ${c}22 1px, transparent 1px) 0 0 / 24px 24px`,
  waves: (c) => `repeating-radial-gradient(circle at 100% 100%, transparent 0 22px, ${c}22 22px 24px)`,
  circles: (c) =>
    `radial-gradient(circle at 85% 15%, ${c}55 0 18%, transparent 18.5%), radial-gradient(circle at 10% 90%, ${c}33 0 25%, transparent 25.5%)`,
};

/** Couverture de produit rendue en HTML/CSS (s'adapte à la largeur `width`). */
export function Cover({ design, width = 300 }: { design: CoverDesign; width?: number }) {
  const d = design;
  return (
    <div
      style={{
        width,
        height: width * 1.5,
        fontSize: width / 20,
        background: `linear-gradient(160deg, ${d.background}, ${d.backgroundEnd})`,
        color: d.text,
        fontFamily: `'${d.fontFamily}', sans-serif`,
      }}
      className="relative flex flex-col overflow-hidden"
    >
      <div className="absolute inset-0" style={{ background: PATTERNS[d.pattern](d.accent) }} />
      <div className="relative flex flex-1 flex-col p-[1.6em]">
        {d.badge && (
          <span
            className="self-start rounded-full px-[0.8em] py-[0.3em] text-[0.6em] font-bold tracking-widest uppercase"
            style={{ background: d.accent, color: d.background }}
          >
            {d.badge}
          </span>
        )}
        <div className="mt-auto">
          <div className="mb-[0.4em] h-[0.25em] w-[3em] rounded" style={{ background: d.accent }} />
          <h2 className="text-[2.1em] leading-[1.05] font-black break-words">{d.title}</h2>
          <p className="mt-[0.6em] text-[0.85em] leading-snug opacity-85" style={{ fontFamily: "Inter, sans-serif" }}>
            {d.subtitle}
          </p>
        </div>
        <div className="mt-[2em] text-[0.7em] font-semibold tracking-wider uppercase opacity-80">{d.author}</div>
      </div>
    </div>
  );
}
