/** Formules d'abonnement et coût en crédits de chaque génération. Modifier ici suffit. */
export type PlanId = "free" | "starter" | "pro" | "business";

export type Plan = {
  id: PlanId;
  name: string;
  priceXof: number; // prix mensuel en FCFA (XOF)
  priceEur: string; // équivalent affiché
  credits: number; // crédits remis chaque mois
  videos: boolean; // accès au rendu vidéo (Higgsfield)
  pages: number; // pages publiées simultanément
  customDomain: boolean; // domaine personnalisé
  highlight?: boolean;
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Gratuit",
    priceXof: 0,
    priceEur: "0 €",
    credits: 5,
    videos: false,
    pages: 1,
    customDomain: false,
    features: ["5 crédits / mois", "1 page publiée", "Tous les modules texte", "Mockups et visuels pub", "Scripts vidéo"],
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceXof: 5000,
    priceEur: "≈ 8 €",
    credits: 30,
    videos: false,
    pages: 3,
    customDomain: false,
    features: ["30 crédits / mois", "3 pages publiées en ligne", "Ebooks, templates, pages de vente, sites", "Mockups et visuels pub", "Stockage cloud de tes projets"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceXof: 15000,
    priceEur: "≈ 23 €",
    credits: 150,
    videos: true,
    pages: 10,
    customDomain: false,
    highlight: true,
    features: ["150 crédits / mois", "10 pages publiées en ligne", "Tout Starter", "Vidéos pub IA : plans animés et avatar parlant", "Vidéos sauvegardées dans le cloud"],
  },
  business: {
    id: "business",
    name: "Business",
    priceXof: 35000,
    priceEur: "≈ 53 €",
    credits: 500,
    videos: true,
    pages: 50,
    customDomain: true,
    features: ["500 crédits / mois", "50 pages publiées en ligne", "Tout Pro", "Domaine personnalisé", "Support prioritaire"],
  },
};

export const PAID_PLANS = [PLANS.starter, PLANS.pro, PLANS.business];

export function isPaidPlan(id: string): id is Exclude<PlanId, "free"> {
  return id === "starter" || id === "pro" || id === "business";
}

export const COSTS = {
  ebook: 5,
  template: 2,
  mockup: 1,
  "sales-page": 3,
  site: 3,
  "video-script": 1,
  "video-render": 4, // par scène (image + animation ou avatar parlant)
  image: 1,
} as const;

export type CostKind = keyof typeof COSTS;

export const COST_LABELS: Record<CostKind, string> = {
  ebook: "Ebook",
  template: "Template",
  mockup: "Couverture",
  "sales-page": "Page de vente",
  site: "Site vitrine",
  "video-script": "Script vidéo",
  "video-render": "Scène vidéo",
  image: "Image IA",
};

/** Nombre maximal d'images IA ajoutées automatiquement à un site ou une page de vente. */
export const MAX_AUTO_IMAGES = 3;
