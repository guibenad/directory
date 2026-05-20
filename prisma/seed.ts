import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_DIRECTORY = {
  slug: "localpro",
  name: "LocalPro",
  tagline: "Annuaire des artisans & professionnels en France",
  description:
    "Trouvez un artisan ou un professionnel de confiance près de chez vous. Plombiers, électriciens, maçons et plus encore.",
  primaryColor: "#F5A623",
  darkBg: "#0F1117",
  emailFrom: "noreply@localpro.fr",
  domains: ["localpro.fr", "www.localpro.fr"] as string[],
};

const METIERS = [
  { slug: "plombier", label: "Plombier" },
  { slug: "electricien", label: "Électricien" },
  { slug: "macon", label: "Maçon" },
  { slug: "peintre", label: "Peintre" },
  { slug: "menuisier", label: "Menuisier" },
];

const VILLES = [
  { slug: "nice", label: "Nice", insee: "06088", dep: "06", depLabel: "Alpes-Maritimes", reg: "93", regLabel: "Provence-Alpes-Côte d'Azur" },
  { slug: "cannes", label: "Cannes", insee: "06029", dep: "06", depLabel: "Alpes-Maritimes", reg: "93", regLabel: "Provence-Alpes-Côte d'Azur" },
  { slug: "antibes", label: "Antibes", insee: "06004", dep: "06", depLabel: "Alpes-Maritimes", reg: "93", regLabel: "Provence-Alpes-Côte d'Azur" },
];

const PLANS = [
  { key: "STARTER", name: "Starter", priceCents: 900, priority: 1, sortOrder: 1, features: ["Fiche basique", "1 photo", "Messagerie"] },
  { key: "ESSENTIEL", name: "Essentiel", priceCents: 2900, priority: 2, sortOrder: 2, features: ["10 photos", "Téléphone affiché", "Badge Certifié", "Statistiques"] },
  { key: "PRO", name: "Pro", priceCents: 4900, priority: 3, sortOrder: 3, features: ["Position prioritaire", "Photos illimitées", "Badge Pro", "Support prioritaire"] },
];

function buildTitle(metier: string, ville: string) {
  return `${metier} à ${ville} — Devis gratuit · LocalPro`;
}
function buildDescription(metier: string, ville: string, n: number) {
  return `Trouvez les meilleurs ${metier.toLowerCase()}s à ${ville}. Comparez les avis, obtenez un devis gratuit. ${n} professionnels référencés.`;
}
function buildH1(metier: string, ville: string) {
  return `${metier} à ${ville} — Devis gratuit · Intervention rapide`;
}

async function main() {
  console.log("🌱 Seeding — architecture multi-tenant");

  // --- Super admin global ---
  const passwordHash = await bcrypt.hash("admin1234", 10);
  await prisma.user.upsert({
    where: { email: "admin@localpro.fr" },
    update: { role: "SUPER_ADMIN", password: passwordHash },
    create: {
      email: "admin@localpro.fr",
      name: "Super Admin",
      password: passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  // --- Annuaire par défaut ---
  const directory = await prisma.directory.upsert({
    where: { slug: DEFAULT_DIRECTORY.slug },
    update: DEFAULT_DIRECTORY,
    create: DEFAULT_DIRECTORY,
  });
  console.log(`✓ Annuaire "${directory.name}" créé`);

  // --- Plans ---
  for (const p of PLANS) {
    await prisma.plan.upsert({
      where: { directoryId_key: { directoryId: directory.id, key: p.key } },
      update: p,
      create: { ...p, directoryId: directory.id },
    });
  }
  console.log(`✓ ${PLANS.length} plans configurés`);

  // --- Catégories ---
  const categories = await Promise.all(
    METIERS.map((m, idx) =>
      prisma.category.upsert({
        where: { directoryId_slug: { directoryId: directory.id, slug: m.slug } },
        update: { label: m.label, sortOrder: idx },
        create: { directoryId: directory.id, slug: m.slug, label: m.label, sortOrder: idx },
      }),
    ),
  );
  console.log(`✓ ${categories.length} catégories créées`);

  // --- Référentiel géo minimal (sera étendu via import geo.api.gouv.fr) ---
  const regions = new Map<string, { code: string; name: string; slug: string }>();
  const departements = new Map<
    string,
    { code: string; name: string; slug: string; regionCode: string }
  >();
  const slugify = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  for (const v of VILLES) {
    if (!regions.has(v.reg)) {
      regions.set(v.reg, { code: v.reg, name: v.regLabel, slug: slugify(v.regLabel) });
    }
    if (!departements.has(v.dep)) {
      departements.set(v.dep, {
        code: v.dep,
        name: v.depLabel,
        slug: slugify(v.depLabel),
        regionCode: v.reg,
      });
    }
  }
  for (const r of regions.values()) {
    await prisma.geoRegion.upsert({ where: { code: r.code }, update: r, create: r });
  }
  for (const d of departements.values()) {
    await prisma.geoDepartement.upsert({ where: { code: d.code }, update: d, create: d });
  }
  for (const v of VILLES) {
    await prisma.geoVille.upsert({
      where: { insee: v.insee },
      update: { slug: v.slug, name: v.label, departementCode: v.dep },
      create: {
        insee: v.insee,
        slug: v.slug,
        name: v.label,
        departementCode: v.dep,
        postalCodes: [],
      },
    });
  }

  // --- Pages SEO ---
  for (const metier of METIERS) {
    const cat = categories.find((c) => c.slug === metier.slug)!;
    for (const ville of VILLES) {
      const slug = `${metier.slug}/${ville.slug}`;
      await prisma.seoPage.upsert({
        where: { directoryId_slug: { directoryId: directory.id, slug } },
        update: {},
        create: {
          directoryId: directory.id,
          categoryId: cat.id,
          metier: metier.slug,
          metierLabel: metier.label,
          ville: ville.slug,
          villeLabel: ville.label,
          villeInsee: ville.insee,
          departement: ville.dep,
          departementLabel: ville.depLabel,
          region: ville.reg,
          regionLabel: ville.regLabel,
          slug,
          title: buildTitle(metier.label, ville.label),
          description: buildDescription(metier.label, ville.label, 3),
          h1: buildH1(metier.label, ville.label),
          isPublished: true,
        },
      });
    }
  }
  console.log(`✓ ${METIERS.length * VILLES.length} pages SEO générées`);

  // --- Entreprises démo + listings ---
  const starterPlan = await prisma.plan.findUnique({
    where: { directoryId_key: { directoryId: directory.id, key: "STARTER" } },
  });
  const essentielPlan = await prisma.plan.findUnique({
    where: { directoryId_key: { directoryId: directory.id, key: "ESSENTIEL" } },
  });
  const proPlan = await prisma.plan.findUnique({
    where: { directoryId_key: { directoryId: directory.id, key: "PRO" } },
  });

  const demoPlans = [
    { plan: proPlan!, priority: 3 },
    { plan: essentielPlan!, priority: 2 },
    { plan: starterPlan!, priority: 1 },
  ];

  let i = 0;
  for (const metier of METIERS) {
    const cat = categories.find((c) => c.slug === metier.slug)!;
    for (const ville of VILLES) {
      for (const { plan, priority } of demoPlans) {
        i++;
        const base = `${metier.label} ${ville.label} ${plan.name}`;
        const globalSlug = `${metier.slug}-${ville.slug}-${plan.key.toLowerCase()}-${i}`;
        const email = `${globalSlug}@example.com`;

        const company = await prisma.company.upsert({
          where: { email },
          update: {},
          create: {
            name: base,
            slug: globalSlug,
            email,
            phone: "04 93 00 00 00",
          },
        });

        await prisma.listing.upsert({
          where: {
            companyId_directoryId: { companyId: company.id, directoryId: directory.id },
          },
          update: {},
          create: {
            companyId: company.id,
            directoryId: directory.id,
            categoryId: cat.id,
            slug: globalSlug,
            ville: ville.slug,
            villeLabel: ville.label,
            description: `Entreprise de démonstration spécialisée en ${metier.label.toLowerCase()} à ${ville.label}.`,
            address: `${i} avenue de la République, ${ville.label}`,
            photos: [],
            priority,
            rating: 3.5 + (i % 3) * 0.5,
            reviewCount: 5 + (i % 20),
          },
        });

        await prisma.subscription.upsert({
          where: {
            companyId_directoryId: { companyId: company.id, directoryId: directory.id },
          },
          update: {},
          create: {
            companyId: company.id,
            directoryId: directory.id,
            planId: plan.id,
            status: "ACTIVE",
          },
        });
      }
    }
  }
  console.log(`✓ ${i} entreprises + listings + abonnements créés`);

  console.log("\n✅ Seed terminé.");
  console.log("   Super admin: admin@localpro.fr / admin1234");
  console.log(`   Annuaire par défaut: ${directory.slug} (${directory.name})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
