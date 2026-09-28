# MÉMOIRE DU PROJET — à lire en premier

> Mémoire de travail de Claude pour ce projet. **À lire au début de chaque session et à mettre à jour
> à la fin de chaque session** (section « Journal » + « Où on en est »). Écrire en français.

---

## 1. Le projet en une phrase

**SaaS marketing IA pour les vendeurs en ligne d'Afrique francophone** : affiches pub, vidéos pub
(UGC avatar et storytelling), pages de vente hébergées et stratégie marketing (organique + payante),
à partir d'une seule « fiche produit ». Slogan : **« Le plus dur, ce n'est pas de créer le produit,
c'est le marketing. On s'en occupe. »**

> ⚠️ **Pivot décidé le 28/09/2026 (session 2)** : le projet s'appelait « Créateur Digital AI » et créait
> aussi des produits (ebooks, templates). Darel a choisi de **recentrer sur le marketing seul**
> (moins d'options, usage hebdomadaire = meilleure rétention). Le code ebook/templates reste dans le
> dépôt mais sera masqué (réactivable plus tard en bonus). Le nom sera peut-être changé.
> **Le code n'a pas encore été adapté à ces décisions** : voir section 2 bis.

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

## 2 bis. Nouveau plan après le pivot (session 2, 28/09/2026) — **lancement prévu en mars 2027**

### Les 4 modules du SaaS marketing
| Module | Déroulé | Modèles Higgsfield prévus |
|---|---|---|
| **Affiches** | Photo/fiche produit → affiche pub. Formats : statut WhatsApp, post Facebook/Instagram, story TikTok | **Graphic ads** (~0,016 $) ou **Ideogram 4.0** (0,03 $, texte multilingue). Secours : fond **Soul 2** (0,003 $) + texte posé par le code (les IA écrivent mal le français) |
| **Vidéos** | Marketing → Vidéos → **UGC** (choisir un avatar prédéfini OU créer le sien → texte ou mot-clé du produit → précisions) ou **Storytelling** (l'IA propose 3 à 5 situations, ou le client écrit la sienne). Pas de voix off seule pour l'instant | **Kling 3.0** (0,084 $/s prix normal) par défaut ; Wan 3.0 en alternative ; Seedance réservé au premium |
| **Pages de vente** | Type (page de vente, site vitrine, mini e-commerce) → sujet, nom, rôle → images (importées ou générées, style choisi) → style de copywriting → style visuel (10 styles au départ, inspirés de design systems type getdesign.md, **renommés**, polices Google Fonts, jamais de logos/noms de marques) → liens d'action (Chariow, WhatsApp `wa.me`, paiement) + pixel Facebook/TikTok | Soul 2 pour les images, Claude pour le texte |
| **Stratégie** | Le client décrit son produit/budget → stratégie organique + payante : plateformes selon le budget, durée de test (phase d'apprentissage), indicateurs (CPC, CTR, coût par vente, ROAS), quoi faire selon les résultats. Recommandations, pas de résultats garantis | Claude (texte seul, très peu cher) |

### La « vidéo montée » (clé de la rentabilité)
Une vidéo pub de 20 à 30 s = **1 clip IA Kling de 5 s** (accroche) + images produit animées (Soul 2) +
voix off IA + sous-titres + musique, **assemblés par le code** (montage automatique à développer, ~2-3
semaines). Coût ≈ **300 FCFA** au lieu de 1 000 à 2 700 FCFA pour 15 s 100 % IA.
**Vidéo avatar qui parle** : Kling 3.0 image → vidéo avec son intégré (à partir d'un portrait Soul 2),
10 s ≈ 500 FCFA → **compte pour 2 vidéos**. Qualité du français **à tester**. Soul ID (2,50 $) possible
pour un avatar personnel cohérent.
**Avatar personnel = consentement obligatoire** : vidéo de 15 à 30 s dans le navigateur (regarder la
caméra, tourner la tête, lire « Moi, [nom], j'autorise … le [date] »), validation manuelle au début.
Avatars prédéfinis = visages africains **générés par IA** (jamais de vraies personnes).

### Formules validées par Darel (quotas calculés sur le pire cas : coût ≤ ~55 % même si tout est utilisé)
| | Gratuit | Starter | Pro ⭐ | Business |
|---|---|---|---|---|
| Prix / mois | 0 | **7 500 FCFA** | **15 000 FCFA** | **30 000 FCFA** |
| Vidéos pub (avatar = 2) | ❌ (vidéos = payant uniquement) | 5 | 15 | 25 |
| Pages de vente hébergées | 1 (badge) | 3 | 8 | 15 |
| Affiches | 10 | 50 | 100 | 300 |
| Stratégies | 1 | 3 | 8 | 15 |
| Domaine perso | ❌ | ❌ | ❌ | ✅ |
| Coût max / marge min | ~390 FCFA | 2 970 / +4 230 (59 %) | 7 920 / +6 480 (45 %) | 15 600 / +13 200 (46 %) |

Coûts unitaires retenus (1 $ = 600 FCFA, **prix normaux hors promo**) : vidéo montée 300 · affiche 15 ·
page de vente 180 (hypothèse, texte Claude à mesurer) · stratégie 60 FCFA. Utilisation réelle attendue
40-60 % → marge réelle ~65-75 %. Frais fixes ≈ 30 000 FCFA/mois → rentable dès **5 Pro ou 8 Starter**.
Recharges : 3 vidéos = 5 000 FCFA, 100 affiches = 2 500 FCFA, 1 avatar perso = 2 500 FCFA.

### Règles de rentabilité
1. Quotas sur le pire cas. 2. Pages publiées sur **Cloudflare** (bande passante gratuite), jamais sur
Netlify (bande passante payante en crédits). 3. Vidéo montée par défaut, avatar compte double.
4. Modèles économiques par défaut, options premium comptent plus. 5. Chaque régénération compte,
échecs remboursés. 6. Paiement 3 mois (-10 %) / 12 mois (-20 %). 7. Wave en direct dès que possible
(1 % de frais). 8. Alertes de dépenses Higgsfield + limite par client et par jour. 9. Négocier un tarif
Higgsfield au volume. 10. Revoir les prix 1 fois par an (dollar, nouveaux modèles). Formule gratuite :
vérification email, blocage des emails jetables, pas de vidéo. Quotas non reportés.

### Nouvelle stack (remplace la section 3 là où elle diffère)
| Rôle | Outil |
|---|---|
| Code | GitHub |
| Application | **Netlify** (remplace Vercel ; adapter `publish.ts` qui utilise l'API Vercel pour les domaines) |
| Pages publiées des clients | **Cloudflare** (+ Cloudflare for SaaS pour les domaines perso) |
| BDD / comptes / fichiers | Supabase (gratuit puis Pro 25 $) |
| Images + vidéos | **Higgsfield** uniquement (fal.ai prévu en secours, mêmes modèles) |
| Textes | Claude |
| Paiement | **PayDunya** (Wave, Orange Money, Free Money, cartes) au lancement, **Wave Business API** (1 %) ensuite. Remplace Stripe (non disponible au Sénégal) et CinetPay. Mobile Money = pas de renouvellement auto → rappels WhatsApp/email J-3, J-1, J+1 |

### Démarches légales de Darel (à faire valider par un comptable / l'APIX)
Créer l'entreprise à l'**APIX** vers déc. 2026 - janv. 2027 (entreprise individuelle 10-21k FCFA pour
démarrer, SUARL plus tard) → RCCM + NINEA → compte bancaire pro (exigé par PayDunya) + carte Visa pour
payer les services en dollars. Impôts : régime **CGU** si CA < 50 M FCFA (vérifier l'éligibilité des
services numériques auprès de la DGID), sinon réel + TVA 18 %. CGU/CGV, politique de confidentialité,
**déclaration à la CDP** (données personnelles, photos/vidéos d'avatar).

### Calendrier
| Période | À faire |
|---|---|
| Fin sept. 2026 | Tests Higgsfield pendant le cashback 100 % (Kling 3.0 vertical 5 s, Kling avec voix en français, Wan 3.0, Graphic ads, Ideogram 4.0) → noter prix réels dans Analytics |
| Oct.-nov. | Adapter le code : pivot marketing (masquer ebook/templates), affiches, vidéo montée, 10 styles de pages, stratégie, Netlify + Cloudflare, PayDunya, nouvelles formules dans `plans.ts` (+ fonction SQL `plan_credits` via une **nouvelle** migration) |
| Déc.-janv. | Entreprise APIX, compte pro, dossier PayDunya, CGU, CDP |
| Févr. 2027 | Bêta fermée (~20 testeurs de ses groupes), ajustement des quotas |
| **Mars 2027** | **Lancement** |

**Marketing prévu :** build in public sur YouTube (« L'Épopée du Jeune Samouraï »), liste d'attente,
offre membres fondateurs, bêta-testeurs dans ses groupes, affiliation, partenariat Chariow, vidéos
courtes démo, challenge « 7 jours », lives. Plus tard : monteur vidéo.

**En attente de Darel :** prix réel du modèle d'avatar parlant / qualité du français avec Kling,
choix entreprise individuelle ou SUARL, nouveau nom éventuel.

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
- **Session 2 (28/09/2026)** — Discussion stratégie, sans code. Analyse des risques (coûts IA vs prix,
  Stripe indisponible au Sénégal, Mobile Money sans renouvellement, abus du gratuit, pages d'arnaque,
  deepfakes, contenu générique, dépendance fournisseurs). **Pivot : SaaS marketing seul** (affiches,
  vidéos, pages de vente, stratégie). Formules 7 500 / 15 000 / 30 000 FCFA, « vidéo montée »,
  Higgsfield (Kling 3.0, Graphic ads, Soul 2), Netlify + Cloudflare, PayDunya puis Wave, création
  d'entreprise APIX. Lancement visé : mars 2027. Tout est détaillé en section 2 bis.
  Prochaine étape : résultats des tests Higgsfield, puis adaptation du code.
