export const TEMPLATE_KINDS = [
  "Planner / agenda",
  "Checklist",
  "Workbook / cahier d'exercices",
  "Tracker (habitudes, budget, objectifs)",
  "Calendrier de contenu réseaux sociaux",
  "Fiches de révision / cheat sheet",
] as const;

export const VIDEO_STYLES = {
  ugc: "UGC (témoignage face caméra, style TikTok/Reels)",
  storytelling: "Storytelling (histoire avant/après, émotion)",
  demo: "Démonstration du produit",
  problem: "Problème → solution (pub directe)",
} as const;

export type VideoStyle = keyof typeof VIDEO_STYLES;
