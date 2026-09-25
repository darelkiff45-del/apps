# Créateur Digital AI

SaaS pour **créer des produits digitaux et leur marketing avec l'IA** : ebooks, templates,
mockups et visuels pub, pages de vente, sites vitrines, et vidéos pub UGC / storytelling
avec avatar IA.

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis ajoute tes clés
npm run dev                  # http://localhost:3000
```

| Variable | Rôle |
|---|---|
| `ANTHROPIC_API_KEY` | Claude : rédaction des ebooks, templates, pages de vente, sites, scripts vidéo, design des couvertures |
| `ANTHROPIC_MODEL` | Modèle Claude (par défaut `claude-opus-5`) |
| `HEYGEN_API_KEY` | HeyGen : génération des vidéos avec avatar IA qui parle face caméra |

## Modules (V1)

| Module | Page | API | Résultat |
|---|---|---|---|
| Fiche produit | partout | — | Nom, niche, client idéal, promesse, prix : partagée par tous les modules |
| Ebook | `/studio/ebook` | `POST /api/ebook` | Ebook complet (couverture, sommaire, chapitres, points clés) → PDF |
| Templates | `/studio/templates` | `POST /api/template` | Planners, checklists, workbooks A4 imprimables → PDF |
| Mockups & visuels | `/studio/mockups` | `POST /api/mockup` | Couverture IA + mockups 3D (livre, tablette, smartphone, pack) + visuels pub post/story → PNG |
| Page de vente | `/studio/page-de-vente` | `POST /api/sales-page` | Page HTML (PAS / AIDA / storytelling), mockup intégré |
| Site vitrine | `/studio/site` | `POST /api/site` | Site one-page responsive → HTML |
| Vidéos pub IA | `/studio/videos` | `/api/video/script`, `/api/video/render`, `/api/video/status`, `/api/video/assets` | Script UGC/storytelling éditable (hooks A/B, scènes) puis vidéo HeyGen |
| Mes projets | `/studio/projets` | — | Historique des générations (navigateur) |

## Architecture

- **Next.js 15 (App Router) + TypeScript + Tailwind CSS 4**
- `src/lib/ai.ts` — appels à Claude (SDK officiel `@anthropic-ai/sdk`, streaming, sorties JSON
  validées par Zod, gestion des refus et fallback serveur)
- `src/lib/heygen.ts` — client de l'API HeyGen (avatars, voix, génération, statut)
- `src/app/api/*` — routes serveur (les clés API ne quittent jamais le serveur)
- `src/components/Mockups.tsx` — mockups rendus en HTML/CSS, exportés en PNG avec `html-to-image`
- Stockage V1 : `localStorage` du navigateur (la V2 ajoute comptes + base de données)

## Feuille de route en 3 versions

Voir [ROADMAP.md](./ROADMAP.md) — aussi affichée sur la page d'accueil (`src/lib/roadmap.ts`).
