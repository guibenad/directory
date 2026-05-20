# LocalPro — Annuaire de Métiers SaaS

Projet : plateforme d'annuaire de métiers en ligne avec pages SEO automatiques (métier × ville) et abonnements mensuels pour les entreprises.

---

## Stack Technique

- **Framework** : Next.js 14 App Router, TypeScript strict
- **Styling** : Tailwind CSS
- **BDD** : PostgreSQL via Supabase, ORM Prisma
- **Auth** : NextAuth.js (rôles ADMIN / COMPANY)
- **Paiements** : Stripe Billing (abonnements récurrents)
- **Emails** : Resend + React Email
- **Déploiement** : Vercel
- **Temps réel** : Supabase Realtime (messagerie)

---

## Design System — RÉFÉRENCE ABSOLUE

Le fichier `/docs/annuaire-metiers.html` est la référence visuelle exacte. Ne jamais s'en écarter sans validation explicite.

## Agents : 

https://github.com/btcdanidan/vibecode-agents

### Variables CSS dashboard (fond sombre)
```css
--bg:       #0F1117   /* fond principal */
--bg2:      #161922   /* fond nav */
--bg3:      #1D2130   /* fond hover / inputs */
--card:     #1F2435   /* cartes */
--border:   #2A3048
--border2:  #35405E
--text:     #E8EBF4
--text2:    #8B93B3
--text3:    #555F82
--amber:    #F5A623   /* couleur principale — CTA, accents, logo */
--amber2:   #FFD07A
--amber-bg: #2A2010
--blue:     #4A90E2
--blue-bg:  #0D1A2E
--green:    #3DD68C
--green-bg: #0D2420
--red:      #FF6B6B
--red-bg:   #2A0F0F
--purple:   #A78BFA
--purple-bg:#1A1230
```

### Polices (Google Fonts — charger dans layout.tsx)
- **Syne** weights 700 + 800 → titres, logo, montants, badges
- **DM Sans** weights 300 + 400 + 500 → corps, labels, inputs, nav

### Pages publiques (fond clair)
- Fond : `#FAFAF8`, texte : `#1A1A1A`
- Hero : fond `#1A1A1A`, texte blanc
- Accent identique : `#F5A623`

---

## Architecture des Dossiers

```
src/
├── app/
│   ├── (admin)/              ← route group protégé (middleware)
│   │   ├── dashboard/
│   │   ├── entreprises/
│   │   ├── abonnements/
│   │   ├── messages/
│   │   └── seo/
│   ├── [metier]/
│   │   └── [ville]/          ← pages SEO publiques SSG/ISR
│   ├── entreprise/
│   │   └── [slug]/           ← fiche entreprise publique
│   ├── inscription/          ← tunnel 3 étapes
│   ├── api/
│   │   ├── companies/
│   │   ├── messages/
│   │   ├── stats/
│   │   ├── seo/
│   │   └── stripe/
│   │       ├── checkout/
│   │       └── webhook/
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── admin/
│   └── public/
└── lib/
    ├── prisma.ts
    ├── stripe.ts
    └── seo.ts
```

---

## Modèle de Données Prisma (résumé)

```prisma
enum PlanType     { STARTER ESSENTIEL PRO }
enum CompanyStatus { TRIAL ACTIVE SUSPENDED CANCELLED }

model Company {
  id              String        @id @default(cuid())
  name            String
  slug            String        @unique
  email           String        @unique
  phone           String?
  description     String?
  address         String?
  metier          String        // 'plombier', 'electricien'...
  ville           String        // 'nice', 'cannes'...
  photos          String[]      // URLs Supabase Storage
  website         String?
  status          CompanyStatus @default(TRIAL)
  plan            PlanType      @default(STARTER)
  priority        Int           @default(0)  // Pro=3, Essentiel=2, Starter=1
  stripeCustomerId String?      @unique
  stripeSubId      String?      @unique
  subscriptionEnd  DateTime?
  rating          Float         @default(0)
  reviewCount     Int           @default(0)
  createdAt       DateTime      @default(now())
  messages        Message[]
  reviews         Review[]
}

model SeoPage {
  id          String   @id @default(cuid())
  metier      String   // 'plombier'
  metierLabel String   // 'Plombier'
  ville       String   // 'nice'
  villeLabel  String   // 'Nice'
  slug        String   @unique
  title       String
  description String
  h1          String
  isPublished Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

---

## Règles Métier Critiques

1. **Ordre d'affichage** sur les pages publiques : `priority DESC` → Pro (3) > Essentiel (2) > Starter (1)
2. **Téléphone masqué** pour les entreprises `plan = STARTER` sur les pages publiques
3. **Stripe est la source de vérité** pour les abonnements — ne jamais modifier `status` ou `plan` manuellement en BDD, uniquement via webhooks
4. **Signature Stripe** : toujours vérifier avec `stripe.webhooks.constructEvent` avant tout traitement webhook
5. **Pages SEO** : `revalidate = 3600` (ISR toutes les heures), jamais de rendu côté client pour le contenu indexable

---

## Webhooks Stripe à implémenter

| Événement | Action |
|-----------|--------|
| `customer.subscription.created` | `status = ACTIVE`, enregistrer `stripeSubId` |
| `customer.subscription.deleted` | `status = CANCELLED`, enregistrer date de fin |
| `customer.subscription.updated` | Mettre à jour `plan` et `priority` |
| `invoice.payment_succeeded` | Logger le paiement |
| `invoice.payment_failed` | `status = SUSPENDED` après 3 tentatives, envoyer email de relance |

---

## Conventions de Code

- TypeScript strict — **pas de `any`**
- Validation **Zod** sur toutes les routes API (côté serveur uniquement)
- Prisma pour toutes les requêtes BDD — **pas de SQL brut**
- Nommage : `PascalCase` composants, `camelCase` fonctions/variables
- Variables d'environnement sensibles : **jamais exposées côté client** (`NEXT_PUBLIC_` seulement pour les clés publiques)
- Rate limiting sur `/api/messages` : max 5 requêtes/heure par IP (Upstash Redis)

---

## Templates SEO (générés automatiquement)

- **`<title>`** : `{MetierLabel} à {VilleLabel} — Devis gratuit · LocalPro`
- **`<meta description>`** : `Trouvez les meilleurs {metier}s à {ville}. Comparez les avis, obtenez un devis gratuit. {n} professionnels référencés.`
- **H1** : `{MetierLabel} à {VilleLabel} — Devis gratuit · Intervention rapide`
- **Canonical** : `https://localpro.fr/{metier}/{ville}`
- **Schema.org** : `ItemList` > `ListItem` > `LocalBusiness` pour chaque entreprise

---

## Variables d'Environnement (.env.local)

```
DATABASE_URL=                     # Supabase > Settings > Database
NEXTAUTH_SECRET=                  # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PK=
STRIPE_WEBHOOK_SECRET=            # stripe listen --print-secret
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@localpro.fr
```
