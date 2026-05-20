/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ApiVille = {
  code: string;
  nom: string;
  codeDepartement: string;
  codeRegion: string;
  codesPostaux: string[];
  population?: number;
  centre?: { type: "Point"; coordinates: [number, number] };
};

type ApiDep = { code: string; nom: string; codeRegion: string };
type ApiReg = { code: string; nom: string };

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return (await res.json()) as T;
}

async function importRegions() {
  console.log("📍 Régions...");
  const regions = await fetchJson<ApiReg[]>("https://geo.api.gouv.fr/regions?fields=code,nom");
  for (const r of regions) {
    await prisma.geoRegion.upsert({
      where: { code: r.code },
      update: { name: r.nom, slug: slugify(r.nom) },
      create: { code: r.code, name: r.nom, slug: slugify(r.nom) },
    });
  }
  console.log(`✓ ${regions.length} régions`);
}

async function importDepartements() {
  console.log("🗺️  Départements...");
  const deps = await fetchJson<ApiDep[]>(
    "https://geo.api.gouv.fr/departements?fields=code,nom,codeRegion",
  );
  for (const d of deps) {
    await prisma.geoDepartement.upsert({
      where: { code: d.code },
      update: { name: d.nom, slug: slugify(d.nom), regionCode: d.codeRegion },
      create: {
        code: d.code,
        name: d.nom,
        slug: slugify(d.nom),
        regionCode: d.codeRegion,
      },
    });
  }
  console.log(`✓ ${deps.length} départements`);
}

async function importVilles(minPopulation: number) {
  console.log(`🏙️  Villes (population ≥ ${minPopulation})...`);
  const all = await fetchJson<ApiVille[]>(
    "https://geo.api.gouv.fr/communes?fields=code,nom,codeDepartement,codeRegion,codesPostaux,population,centre",
  );

  // Récupère les departement codes existants en BDD pour filtrer les villes orphelines
  const existingDeps = new Set(
    (await prisma.geoDepartement.findMany({ select: { code: true } })).map((d) => d.code),
  );

  const filtered = all.filter(
    (v) => (v.population ?? 0) >= minPopulation && existingDeps.has(v.codeDepartement),
  );
  const skipped = all.filter(
    (v) => (v.population ?? 0) >= minPopulation && !existingDeps.has(v.codeDepartement),
  );
  console.log(
    `→ ${filtered.length} villes à importer sur ${all.length} au total (${skipped.length} ignorées : département non référencé)`,
  );

  // Slugs uniques : on suffixe par le code département au second conflit
  const usedSlugs = new Set<string>();
  let done = 0;
  let errors = 0;
  for (const v of filtered) {
    let slug = slugify(v.nom);
    if (usedSlugs.has(slug)) slug = `${slug}-${v.codeDepartement}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${v.code}`;
    usedSlugs.add(slug);

    const [lng, lat] = v.centre?.coordinates ?? [null, null];
    try {
      await prisma.geoVille.upsert({
        where: { insee: v.code },
        update: {
          slug,
          name: v.nom,
          departementCode: v.codeDepartement,
          postalCodes: v.codesPostaux ?? [],
          population: v.population ?? 0,
          lat: lat ?? undefined,
          lng: lng ?? undefined,
        },
        create: {
          insee: v.code,
          slug,
          name: v.nom,
          departementCode: v.codeDepartement,
          postalCodes: v.codesPostaux ?? [],
          population: v.population ?? 0,
          lat: lat ?? undefined,
          lng: lng ?? undefined,
        },
      });
      done++;
    } catch (err) {
      errors++;
      if (errors <= 3) console.warn(`  ⚠️  ${v.nom} (${v.code}): ${(err as Error).message}`);
    }
    if (done % 500 === 0 && done > 0) console.log(`  ${done}/${filtered.length}`);
  }
  console.log(`✓ ${done} villes importées${errors > 0 ? ` (${errors} erreurs ignorées)` : ""}`);
}

async function generateSeoPages(directorySlug: string) {
  const directory = await prisma.directory.findUnique({
    where: { slug: directorySlug },
    include: { categories: true },
  });
  if (!directory) {
    console.warn(`Annuaire "${directorySlug}" introuvable — SEO pages non générées`);
    return;
  }

  const villes = await prisma.geoVille.findMany({
    orderBy: { population: "desc" },
    include: { departement: { include: { region: true } } },
  });

  console.log(
    `📝 Génération SEO : ${directory.categories.length} catégories × ${villes.length} villes = ${directory.categories.length * villes.length} pages`,
  );

  let created = 0;
  for (const cat of directory.categories) {
    for (const v of villes) {
      const slug = `${cat.slug}/${v.slug}`;
      const title = `${cat.label} à ${v.name} — Devis gratuit · ${directory.name}`;
      const description = `Trouvez les meilleurs ${cat.label.toLowerCase()}s à ${v.name}. Comparez les avis, obtenez un devis gratuit.`;
      const h1 = `${cat.label} à ${v.name} — Devis gratuit · Intervention rapide`;

      await prisma.seoPage.upsert({
        where: { directoryId_slug: { directoryId: directory.id, slug } },
        update: {},
        create: {
          directoryId: directory.id,
          categoryId: cat.id,
          metier: cat.slug,
          metierLabel: cat.label,
          ville: v.slug,
          villeLabel: v.name,
          villeInsee: v.insee,
          departement: v.departementCode,
          departementLabel: v.departement.name,
          region: v.departement.regionCode,
          regionLabel: v.departement.region.name,
          slug,
          title,
          description,
          h1,
          isPublished: true,
        },
      });
      created++;
      if (created % 1000 === 0) {
        console.log(`  ${created} pages...`);
      }
    }
  }
  console.log(`✓ ${created} pages SEO générées pour "${directory.name}"`);
}

async function main() {
  const minPop = Number(process.env.IMPORT_MIN_POPULATION ?? 2000);
  const directorySlug = process.env.IMPORT_DIRECTORY_SLUG ?? "localpro";

  await importRegions();
  await importDepartements();
  await importVilles(minPop);

  if (process.env.IMPORT_GENERATE_SEO !== "false") {
    await generateSeoPages(directorySlug);
  }

  console.log("\n✅ Import terminé.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
