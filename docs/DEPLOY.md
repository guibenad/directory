# Déploiement Vercel — LocalPro

## 1. Prérequis (avant le 1er deploy)

1. **DB Postgres prod** — Supabase Project > Settings > Database → récupérer l'URL `postgresql://...` (mode `session pooler` pour Prisma).
2. **Supabase Storage** — le bucket `listings` sera créé automatiquement après déploiement via :
   ```
   npm run supabase:ensure-buckets
   ```
   (à lancer depuis ta machine avec les vars d'env prod, ou depuis la console Vercel CLI).
3. **Stripe** — mode Test d'abord, puis Live :
   - Créer la clé API secrète, la clé publique
   - Pas besoin de créer les Products/Prices à la main : `npm run stripe:sync-plans` le fera après déploiement
4. **Resend** — domaine vérifié (`noreply@tondomaine.fr`) + clé API
5. **Upstash Redis** (optionnel mais recommandé) — pour rate-limits distribués
6. **Google Places API** (optionnel) — Google Cloud > API Key avec "Places API (new)" activé

## 2. Variables d'environnement Vercel

Copier `.env.example` et remplir :

```
DATABASE_URL=postgresql://...          # Supabase (pooler)
DIRECT_URL=postgresql://...            # Supabase (direct, pour migrations) — optionnel si schema a directUrl
NEXTAUTH_SECRET=                       # openssl rand -base64 32
NEXTAUTH_URL=https://tondomaine.fr     # domaine de prod

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PK=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...        # à remplir après step 4

RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@tondomaine.fr

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

CRON_SECRET=                           # openssl rand -base64 32 — obligatoire en prod

GOOGLE_PLACES_API_KEY=                 # optionnel (intégration avis Google)
```

## 3. Premier déploiement

1. Push le repo sur GitHub
2. Sur vercel.com : **Import Git Repository** → sélectionner le projet
3. Framework preset : **Next.js** (auto-détecté)
4. Configurer les env vars ci-dessus
5. **Deploy**

Le build exécute automatiquement :
- `prisma generate` (postinstall)
- `next build`

## 4. Post-déploiement

### a. Migrer la BDD
Depuis ta machine, avec `DATABASE_URL` pointant vers la prod :
```bash
npm run db:deploy
```

### b. Seeder les annuaires
```bash
DATABASE_URL=<prod> npm run db:seed
DATABASE_URL=<prod> npm run db:import-france   # si besoin du référentiel géo
```

### c. Créer le bucket Supabase
```bash
npm run supabase:ensure-buckets
```

### d. Webhook Stripe
1. Dashboard Stripe > Developers > Webhooks > Add endpoint
2. URL : `https://tondomaine.fr/api/stripe/webhook`
3. Events à sélectionner :
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copier le **Signing secret** → `STRIPE_WEBHOOK_SECRET` sur Vercel → redéployer

### e. Sync Products/Prices Stripe
Depuis ta machine avec les vars de prod :
```bash
npm run stripe:sync-plans
```
Ou dans le back-office : **Admin > Config > Plans** → bouton "↻ Sync Stripe" sur chaque plan.

### f. Crons Vercel
Déjà configurés dans [vercel.json](../vercel.json) :
- `/api/cron/trial-ending` → chaque jour 9h
- `/api/cron/monthly-recap` → le 1er de chaque mois 8h

Vercel Cron envoie automatiquement `Authorization: Bearer $CRON_SECRET`. Rien à faire côté dashboard.

## 5. Domaines custom (multi-tenant)

Chaque annuaire peut avoir son propre domaine :
1. Ajouter le domaine sur Vercel > Project > Settings > Domains
2. Dans l'admin super-admin > Annuaires > éditer → ajouter le hostname dans `domains: ["plombier-nice.fr"]`
3. Le middleware résout le tenant à partir du hostname

## 6. Checklist post-lancement

- [ ] Tester le tunnel d'inscription complet (inscription → Stripe SetupIntent → fiche publiée)
- [ ] Tester magic link (mode magic sur `/login`, vérifier réception Resend)
- [ ] Tester un paiement Stripe (carte test `4242 4242 4242 4242`)
- [ ] Vérifier que `/sitemap.xml` et `/robots.txt` sont accessibles
- [ ] Google Search Console : soumettre le sitemap
- [ ] Tester le formulaire de contact (rate-limit + email au commerçant)
