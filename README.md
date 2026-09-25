# Créateur Digital AI

SaaS pour **créer des produits digitaux et leur marketing avec l'IA** : ebooks, templates,
mockups et visuels pub, pages de vente, sites vitrines publiables en 1 clic, et vidéos pub
UGC / storytelling (plans animés et avatar parlant).

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
| `HF_CREDENTIALS` | Higgsfield (`KEY_ID:KEY_SECRET`) : images IA et vidéos (plans animés, avatar parlant) |
| `HIGGSFIELD_IMAGE_MODEL`, `HIGGSFIELD_DOP_MODEL` | Optionnel : modèle d'image et qualité d'animation |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase : comptes, base de données, stockage cloud |
| `NEXT_PUBLIC_APP_URL` | URL publique de l'app (retours de paiement, webhooks) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe : abonnements par carte |
| `CINETPAY_API_KEY`, `CINETPAY_SITE_ID` | CinetPay : paiements Mobile Money (Orange, MTN, Moov, Wave) |
| `NEXT_PUBLIC_PAGES_DOMAIN` | Domaine des pages publiées (`nom.pages-domaine.com`) |
| `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` | Domaines personnalisés des clients (formule Business) |

## Mise en place de la V2 (comptes et paiements)

1. **Supabase** — crée un projet sur supabase.com, puis :
   - *SQL Editor* → exécute **dans l'ordre** `supabase/migrations/0001_v2_comptes_credits.sql`
     (tables, sécurité par utilisateur, crédits, bucket « projects ») puis
     `supabase/migrations/0002_v2_publication_medias.sql` (pages publiées, bucket public « media ») ;
   - *Project Settings → API* → copie l'URL, la clé `anon` et la clé `service_role` dans `.env.local` ;
   - *Authentication → URL Configuration* → ajoute `https://ton-domaine/auth/callback` aux Redirect URLs ;
   - *Authentication → Providers → Google* → active Google (identifiants OAuth de Google Cloud).
2. **Stripe** — *Developers → API keys* pour `STRIPE_SECRET_KEY` ; *Developers → Webhooks* → endpoint
   `https://ton-domaine/api/webhooks/stripe` avec les événements `checkout.session.completed`,
   `invoice.paid`, `customer.subscription.deleted` → copie le secret de signature dans `STRIPE_WEBHOOK_SECRET`.
   Active aussi le *Customer portal* (Settings → Billing) pour la gestion d'abonnement.
3. **CinetPay** — dans ton espace marchand, récupère l'API key et le Site ID. L'URL de notification
   (`/api/webhooks/cinetpay`) est envoyée automatiquement à chaque paiement.

4. **Higgsfield** — crée une clé API (format `KEY_ID:KEY_SECRET`) et recharge des crédits Higgsfield :
   ils paient les images et les vidéos générées.
5. **Hébergement Vercel** — importe le dépôt sur vercel.com, colle les variables d'environnement, puis :
   - *Settings → Domains* : ajoute ton domaine d'app (ex. `app.mondomaine.com`) et le domaine
     **wildcard** des pages publiées (ex. `*.pages.mondomaine.com`, DNS gérés par Vercel) ;
   - mets `NEXT_PUBLIC_APP_URL=https://app.mondomaine.com` et `NEXT_PUBLIC_PAGES_DOMAIN=pages.mondomaine.com` ;
   - pour les domaines personnalisés (Business) : crée un token (*Account Settings → Tokens*) et renseigne
     `VERCEL_TOKEN`, `VERCEL_PROJECT_ID` (*Project Settings → General*) et `VERCEL_TEAM_ID` si le projet
     est dans une équipe.

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
| Business | 35 000 FCFA | 500 | ✓ + domaine perso |

Pages publiées : Gratuit 1 (avec badge « Créé avec Créateur Digital ») · Starter 3 · Pro 10 · Business 50.

Coûts : ebook 5 · template 2 · couverture 1 (2 pour 3 versions) · page de vente 3 · site 3 · script vidéo 1 ·
image IA 1 · scène vidéo 4. Les **3 versions (A/B/C)** coûtent 3 fois le prix ; les **images IA automatiques**
ajoutent jusqu'à 3 crédits (les images non utilisées sont remboursées).
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
| Vidéos pub IA | `/studio/videos` | `/api/video/script`, `/api/video/render`, `/api/video/status` | Script UGC/storytelling (hooks A/B, 3 versions), puis chaque scène produite par Higgsfield : plan animé (DoP) ou avatar parlant avec ta voix (Speak) |
| Éditeur visuel | sites, pages de vente, templates | `/api/media`, `/api/image` | Textes, images (import ou IA), couleurs, sections ; republication automatique |
| Mes pages en ligne | `/studio/publications` | `/api/sites` | Publication en 1 clic, vues, domaine personnalisé (Vercel) |
| Mes projets | `/studio/projets` | `/api/projects` | Projets et fichiers sauvegardés dans le cloud (import des projets V1) |
| Mon compte | `/studio/compte` | `/api/me`, `/api/billing/*` | Formule, crédits, consommation, paiements |
| Tarifs | `/tarifs` | `/api/billing/checkout` | Choix de la formule, paiement Mobile Money ou carte |

## Architecture

- **Next.js 15 (App Router) + TypeScript + Tailwind CSS 4**
- `src/lib/ai.ts` — appels à Claude (SDK officiel `@anthropic-ai/sdk`, streaming, sorties JSON
  validées par Zod, gestion des refus et fallback serveur)
- `src/lib/higgsfield.ts` — SDK officiel Higgsfield : images, animation DoP, avatar parlant Speak, statut
- `src/lib/images.ts` — images IA stockées dans le bucket public « media », images automatiques des pages
- `src/lib/publish.ts` — service des pages publiées (isolées par CSP sandbox) et domaines perso via l'API Vercel
- `src/components/VisualEditor.tsx` — éditeur visuel (iframe isolée, communication par postMessage)
- `src/app/api/*` — routes serveur (les clés API ne quittent jamais le serveur)
- `src/components/Mockups.tsx` — mockups rendus en HTML/CSS, exportés en PNG avec `html-to-image`
- `src/lib/account.ts` — utilisateur connecté, profil, débit/remboursement des crédits
- `src/lib/billing.ts` — Stripe (abonnement carte) et CinetPay (Mobile Money), vérification des paiements
- `src/middleware.ts` — session Supabase, accès au studio réservé aux utilisateurs connectés
- `supabase/migrations/` — schéma de la base (RLS : chaque utilisateur ne voit que ses données)

## Feuille de route en 3 versions

Voir [ROADMAP.md](./ROADMAP.md) — aussi affichée sur la page d'accueil (`src/lib/roadmap.ts`).
