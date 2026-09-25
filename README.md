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
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase : comptes, base de données, stockage cloud |
| `NEXT_PUBLIC_APP_URL` | URL publique de l'app (retours de paiement, webhooks) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe : abonnements par carte |
| `CINETPAY_API_KEY`, `CINETPAY_SITE_ID` | CinetPay : paiements Mobile Money (Orange, MTN, Moov, Wave) |

## Mise en place de la V2 (comptes et paiements)

1. **Supabase** — crée un projet sur supabase.com, puis :
   - *SQL Editor* → colle et exécute `supabase/migrations/0001_v2_comptes_credits.sql`
     (tables, sécurité par utilisateur, fonctions de crédits, bucket de stockage « projects ») ;
   - *Project Settings → API* → copie l'URL, la clé `anon` et la clé `service_role` dans `.env.local` ;
   - *Authentication → URL Configuration* → ajoute `https://ton-domaine/auth/callback` aux Redirect URLs ;
   - *Authentication → Providers → Google* → active Google (identifiants OAuth de Google Cloud).
2. **Stripe** — *Developers → API keys* pour `STRIPE_SECRET_KEY` ; *Developers → Webhooks* → endpoint
   `https://ton-domaine/api/webhooks/stripe` avec les événements `checkout.session.completed`,
   `invoice.paid`, `customer.subscription.deleted` → copie le secret de signature dans `STRIPE_WEBHOOK_SECRET`.
   Active aussi le *Customer portal* (Settings → Billing) pour la gestion d'abonnement.
3. **CinetPay** — dans ton espace marchand, récupère l'API key et le Site ID. L'URL de notification
   (`/api/webhooks/cinetpay`) est envoyée automatiquement à chaque paiement.

> Les paiements CinetPay et Stripe ne passent pas par `localhost` : pour tester les webhooks en local,
> utilise un tunnel (ex. `stripe listen --forward-to localhost:3000/api/webhooks/stripe`).

### Formules et crédits

Tout est dans `src/lib/plans.ts` (prix, crédits, coût de chaque génération). Si tu changes les crédits
mensuels, mets aussi à jour la fonction SQL `plan_credits`.

| Formule | Prix / mois | Crédits / mois | Vidéos avatar |
|---|---|---|---|
| Gratuit | 0 | 5 | — |
| Starter | 5 000 FCFA | 30 | — |
| Pro | 15 000 FCFA | 150 | ✓ |
| Business | 35 000 FCFA | 500 | ✓ |

Coûts : ebook 5 · template 2 · couverture 1 · page de vente 3 · site 3 · script vidéo 1 · vidéo avatar 10.
Les crédits sont débités de façon atomique côté base de données et **remboursés automatiquement** si la
génération échoue. Mobile Money = 30 jours par paiement ; carte = abonnement renouvelé automatiquement.

## Modules

| Module | Page | API | Résultat |
|---|---|---|---|
| Fiche produit | partout | — | Nom, niche, client idéal, promesse, prix : partagée par tous les modules |
| Ebook | `/studio/ebook` | `POST /api/ebook` | Ebook complet (couverture, sommaire, chapitres, points clés) → PDF |
| Templates | `/studio/templates` | `POST /api/template` | Planners, checklists, workbooks A4 imprimables → PDF |
| Mockups & visuels | `/studio/mockups` | `POST /api/mockup` | Couverture IA + mockups 3D (livre, tablette, smartphone, pack) + visuels pub post/story → PNG |
| Page de vente | `/studio/page-de-vente` | `POST /api/sales-page` | Page HTML (PAS / AIDA / storytelling), mockup intégré |
| Site vitrine | `/studio/site` | `POST /api/site` | Site one-page responsive → HTML |
| Vidéos pub IA | `/studio/videos` | `/api/video/script`, `/api/video/render`, `/api/video/status`, `/api/video/assets` | Script UGC/storytelling éditable (hooks A/B, scènes) puis vidéo HeyGen |
| Mes projets | `/studio/projets` | `/api/projects` | Projets et fichiers sauvegardés dans le cloud (import des projets V1) |
| Mon compte | `/studio/compte` | `/api/me`, `/api/billing/*` | Formule, crédits, consommation, paiements |
| Tarifs | `/tarifs` | `/api/billing/checkout` | Choix de la formule, paiement Mobile Money ou carte |

## Architecture

- **Next.js 15 (App Router) + TypeScript + Tailwind CSS 4**
- `src/lib/ai.ts` — appels à Claude (SDK officiel `@anthropic-ai/sdk`, streaming, sorties JSON
  validées par Zod, gestion des refus et fallback serveur)
- `src/lib/heygen.ts` — client de l'API HeyGen (avatars, voix, génération, statut)
- `src/app/api/*` — routes serveur (les clés API ne quittent jamais le serveur)
- `src/components/Mockups.tsx` — mockups rendus en HTML/CSS, exportés en PNG avec `html-to-image`
- `src/lib/account.ts` — utilisateur connecté, profil, débit/remboursement des crédits
- `src/lib/billing.ts` — Stripe (abonnement carte) et CinetPay (Mobile Money), vérification des paiements
- `src/middleware.ts` — session Supabase, accès au studio réservé aux utilisateurs connectés
- `supabase/migrations/` — schéma de la base (RLS : chaque utilisateur ne voit que ses données)

## Feuille de route en 3 versions

Voir [ROADMAP.md](./ROADMAP.md) — aussi affichée sur la page d'accueil (`src/lib/roadmap.ts`).
