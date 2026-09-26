# MÉMOIRE DU PROJET — à lire en premier

> Mémoire de travail de Claude pour ce projet. **À lire au début de chaque session et à mettre à jour
> à la fin de chaque session** (section « Journal » + « Où on en est »). Écrire en français.

---

## 1. Le projet en une phrase

**Créateur Digital AI** : un SaaS où l'on crée des produits digitaux (ebooks, templates) **et tout leur
marketing** (couvertures et mockups, pages de vente, sites vitrines publiés en 1 clic, vidéos pub UGC /
storytelling) avec l'IA, à partir d'une seule « fiche produit ».

- Propriétaire : **Darel** (darelkiff45@gmail.com). Créateur de produits digitaux, public d'Afrique
  francophone (prix en **FCFA**, paiement **Mobile Money**). Il **n'est pas développeur** : lui parler
  en français simple, lui poser des questions à choix quand une décision lui revient, lui dire
  concrètement quoi configurer.
- Dépôt : `darelkiff45-del/apps` — branche de travail actuelle : `claude/dazzling-noether-e0sh9z`.
  Aucune Pull Request n'a encore été ouverte (ne pas en créer sans qu'il le demande).

---

## 2. Où on en est (mettre à jour à chaque session)

| Version | État | Contenu |
|---|---|---|
| **V1 — Studio IA** | ✅ terminée | Fiche produit, ebook (PDF), templates, mockups + visuels pub, page de vente, site vitrine, scripts vidéo |
| **V2 lot 1** | ✅ terminée | Comptes Supabase, base de données, abonnements Stripe + CinetPay, crédits, stockage cloud |
| **V2 lot 2** | ✅ terminée | Éditeur visuel, images IA Higgsfield, 3 versions A/B/C, publication 1 clic + domaines perso, vidéos Higgsfield |
| **V3 — Machine de vente** | ⏳ prochaine étape | Voir `ROADMAP.md` (boutique/Chariow, montage vidéo auto, programmation posts, A/B tests, stats, emails/WhatsApp, marketplace, mode agence) |

**Idée proposée à Darel, pas encore faite :** « Retoucher avec Claude » dans l'éditeur visuel
(le client écrit « rends le titre plus percutant » et Claude modifie la page).

**Rien n'a encore été testé avec de vraies clés** (Claude, Higgsfield, Supabase, Stripe, CinetPay,
Vercel) : Darel doit d'abord créer les comptes (liste dans le README, section « Mise en place »).
Au premier vrai test, vérifier en priorité : la génération Claude, les images Higgsfield, les webhooks
de paiement et la publication sur sous-domaine.

---

## 3. Décisions prises avec Darel (ne pas remettre en cause sans lui demander)

| Sujet | Choix |
|---|---|
| Stack | Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 |
| IA texte | **Claude** via le SDK officiel `@anthropic-ai/sdk` — modèle par défaut `claude-opus-5` (variable `ANTHROPIC_MODEL`) |
| Images IA | **Higgsfield** (a remplacé fal.ai) — modèle `flux-pro/kontext/max/text-to-image` |
| Vidéos IA | **Higgsfield** (a remplacé HeyGen) : DoP = image → plan animé ; Speak = visage + voix WAV → avatar parlant (≤ 15 s/scène) |
| Comptes / BDD / stockage | **Supabase** (auth email, Google, lien magique ; Postgres avec RLS ; buckets `projects` privé et `media` public) |
| Paiement carte | **Stripe** (abonnement mensuel en XOF) |
| Paiement Mobile Money | **CinetPay** (paiement de 30 jours, revérifié via leur API) |
| Hébergement | **Vercel** ; pages publiées sur `slug.NEXT_PUBLIC_PAGES_DOMAIN` ; domaines perso via l'API Vercel |
| Formules | Gratuit 0 (5 crédits) · Starter 5 000 FCFA (30) · Pro 15 000 FCFA (150 + vidéos) · Business 35 000 FCFA (500 + domaine perso) |
| Pages publiées | Gratuit 1 (avec badge) · Starter 3 · Pro 10 · Business 50 |
| Coûts en crédits | ebook 5 · template 2 · couverture 1 (2 pour 3 versions) · page de vente 3 · site 3 · script vidéo 1 · image IA 1 · scène vidéo 4 ; 3 versions = ×3 |
| Découpage | Feuille de route en 3 versions (V1/V2/V3), chaque grosse version livrée en lots |

---

## 4. Carte du code

```
src/
  lib/
    ai.ts            Claude : generateJSON (Zod) / generateHTML, streaming, fallbacks, erreurs FR
    route.ts         handler() commun des API : connexion, validation Zod, crédits (cost), remboursement partiel (ctx.refund), sauvegarde auto (save)
    account.ts       requireUser, getProfile, withCredits, refundCredits, requireVideoPlan, createProject
    plans.ts         ⭐ formules, prix, crédits, COSTS — modifier ici (et la fonction SQL plan_credits si crédits mensuels)
    billing.ts       Stripe checkout + CinetPay init/vérification
    publish.ts       pages publiées (CSP sandbox), badge formule gratuite, domaines Vercel
    higgsfield.ts    SDK Higgsfield : hfImage, hfAnimate (DoP), hfSpeak, hfStatus
    images.ts        generateImage (→ bucket media), fillAiImages (src="ai:…"), uploadDataUrl (images + WAV)
    variants.ts      runVariants (3 versions en parallèle, remboursement des échecs)
    client.ts        côté navigateur : useStored (localStorage), useBrief, useProfile, api(), useGenerate, download
    brief.ts         schéma de la fiche produit
    ebook.ts         ebook → HTML imprimable A4
    roadmap.ts       feuille de route affichée sur l'accueil (garder en phase avec ROADMAP.md)
    wav.ts           conversion audio → WAV mono 16 bits (navigateur)
    supabase/        clients serveur (session + admin service role) et navigateur
  middleware.ts      session Supabase, protection /studio, réécriture des sous-domaines / domaines perso → /serve/[host]
  app/
    page.tsx, tarifs/, connexion/, auth/callback/     pages publiques
    studio/*         ebook, templates, mockups, page-de-vente, site, videos, projets, publications, compte
    api/*            une route par génération + projects, sites, billing, webhooks, media, image, me
    p/[slug], serve/[host]   affichage public des pages publiées
  components/
    HtmlWorkspace.tsx  choix A/B/C + aperçu + éditeur + publication (sites, pages de vente, templates)
    VisualEditor.tsx + editor-script.ts   éditeur visuel (iframe sandbox, postMessage)
    Mockups.tsx, Cover.tsx   mockups HTML/CSS exportés en PNG (html-to-image)
    VoiceRecorder.tsx, PublishPanel.tsx, PricingTable.tsx, Sidebar.tsx, BriefForm.tsx, Options.tsx, ui.tsx
supabase/migrations/  0001 (comptes, crédits, paiements) puis 0002 (sites publiés, bucket media)
```

---

## 5. Règles et conventions

- **Tout le texte visible est en français** (UI, messages d'erreur, prompts IA). Tutoiement.
- Toute nouvelle génération IA passe par `handler(Input, fn, { cost, save })` dans `src/lib/route.ts` :
  les crédits sont débités avant et remboursés si ça échoue. Ajouter son coût dans `COSTS` (`plans.ts`).
- Les clés API restent **côté serveur** (`import "server-only"`). Jamais de clé dans le navigateur.
- Les crédits/formules ne se modifient **que** via les fonctions SQL (service role). Les tables ont la RLS.
- Le HTML généré par l'IA n'est jamais exécuté avec l'origine de l'app : iframe `sandbox` sans
  `allow-same-origin`, et pages publiées servies avec l'en-tête `Content-Security-Policy: sandbox`.
- Nouvelle modification de base de données → **nouveau fichier** `supabase/migrations/000X_….sql`
  (ne pas modifier les anciens, Darel les a peut-être déjà exécutés).
- Mettre à jour `README.md`, `ROADMAP.md`, `src/lib/roadmap.ts` et **ce fichier** quand une fonctionnalité change.
- Commits en français, descriptifs. Pousser sur la branche de travail. Pas de PR sans demande.

---

## 6. Vérifier son travail (commandes)

```bash
npm install
npx tsc --noEmit          # types
npx next build            # compilation complète
npx next start -p 3300    # lancer (sans .env.local, le studio s'ouvre sans connexion : pratique pour tester l'UI)
```

- **Navigateur de test** : Chromium est dans `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`,
  utiliser `playwright-core` (installé dans le dossier scratchpad, pas dans le projet).
  Astuce : injecter des données dans `localStorage` (`last-site-v2`, `cover-design`, `brief`…) pour tester les écrans.
- **Tester le SQL** : Postgres 16 local (`/usr/lib/postgresql/16/bin`) avec de faux schémas `auth` et
  `storage` ; lancer en tant qu'utilisateur `postgres` dans un dossier qui lui appartient (ex. `/var/tmp/pgtest`).

---

## 7. Pièges déjà rencontrés

- **Ne jamais faire `pkill -f "next start"`** : ça tue aussi le shell de la commande. Tuer par PID
  (`ps -eo pid,args | grep next-server`).
- Playwright : `text=OK` correspond aussi à « Eb**ok** » → utiliser `button:text-is("OK")`.
- Fichiers `route.ts` de Next : on ne peut exporter que les handlers/config (pas de constantes) ;
  les `export type` sont autorisés. Mettre les constantes dans `src/lib/constants.ts`.
- Tailwind 4 : les classes réutilisables (`btn`, `input`, `card`…) se déclarent avec `@utility` dans `globals.css`.
- La documentation Higgsfield (docs.higgsfield.ai) est **bloquée** depuis l'environnement cloud :
  lire le SDK `node_modules/@higgsfield/client` (README + `dist/v2/types.d.ts`).
- Claude API : pas de `budget_tokens` ni de prefill sur les modèles récents ; on utilise
  `thinking: { type: "adaptive" }`, `output_config.effort` et `fallbacks: "default"` (beta
  `server-side-fallback-2026-07-01`).
- Stripe : la formule et l'utilisateur d'une facture sont dans `invoice.parent.subscription_details.metadata`.

---

## 8. Journal des sessions

- **Session 1 (25–26/09/2026)** — Idée du SaaS. V1 complète (Claude + HeyGen). Feuille de route en 3 versions.
  V2 lot 1 (Supabase, Stripe, CinetPay, crédits, cloud). V2 lot 2 (éditeur visuel, 3 versions,
  publication, domaines perso). Darel a choisi **Higgsfield pour les images et les vidéos** → fal.ai et
  HeyGen retirés. Création de ce fichier mémoire et de `CLAUDE.md`.
  Prochaine étape proposée : V3, ou « Retoucher avec Claude » dans l'éditeur.
