/**
 * Enrichit la fiche `plombier-nice-pro-1` avec description longue,
 * photos, services et réseaux sociaux pour tester le rendu public.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_SLUG = "plombier-nice-pro-1";

const DEMO_PHOTOS = [
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1585128792020-803d29415281?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&auto=format&fit=crop",
];

const DESCRIPTION = `Plomberie Martin intervient à Nice et sur toute la Côte d'Azur depuis 2012. Nous sommes spécialisés dans le dépannage rapide 24h/24, l'installation de salles de bain et la rénovation complète de vos systèmes sanitaires.

Notre équipe de 6 plombiers certifiés Qualibat et Qualigaz prend en charge tous les types de travaux — du simple débouchage à la rénovation intégrale. Toutes nos interventions sont garanties 1 an pièces et main d'œuvre, et nous établissons un devis gratuit sous 24h pour tout projet.

Nous privilégions les marques françaises (Grohe, Jacob Delafon, Atlantic) et proposons un service clé en main : déplacement, matériel fourni, nettoyage du chantier inclus. Plus de 1 200 interventions réalisées à Nice en 2024.`;

const SERVICES = [
  {
    title: "Dépannage urgence 24h/24",
    items: [
      "Fuite d'eau et recherche de fuite",
      "Débouchage canalisation",
      "Chauffe-eau en panne",
      "Rupture de canalisation",
      "WC bouché",
    ],
    priceLabel: "à partir de 89 €",
    sortOrder: 0,
  },
  {
    title: "Installation salle de bain",
    items: [
      "Salle de bain complète clé en main",
      "Remplacement baignoire / douche italienne",
      "WC suspendu",
      "Robinetterie et mitigeurs",
      "Raccordement machine à laver",
    ],
    priceLabel: "Sur devis",
    sortOrder: 1,
  },
  {
    title: "Chauffe-eau & chaudière",
    items: [
      "Remplacement chauffe-eau électrique",
      "Installation chaudière gaz",
      "Ballon thermodynamique",
      "Entretien annuel et détartrage",
    ],
    priceLabel: "à partir de 350 €",
    sortOrder: 2,
  },
  {
    title: "Rénovation complète",
    items: [
      "Rénovation plomberie d'un appartement",
      "Mise aux normes",
      "Création d'évacuations",
      "Isolation et gainage",
    ],
    priceLabel: "Sur devis",
    sortOrder: 3,
  },
];

async function main() {
  const listing = await prisma.listing.findFirst({
    where: { slug: TARGET_SLUG },
    include: { company: true },
  });
  if (!listing) {
    console.error(`❌ Listing "${TARGET_SLUG}" introuvable.`);
    process.exit(1);
  }

  await prisma.listing.update({
    where: { id: listing.id },
    data: {
      description: DESCRIPTION,
      address: "12 rue de la République, 06000 Nice",
      photos: DEMO_PHOTOS,
      whatsapp: "+33612345678",
      facebook: "https://facebook.com/plomberie.martin.nice",
      instagram: "https://instagram.com/plomberie_martin_nice",
    },
  });

  // Remplace tous les services existants
  await prisma.service.deleteMany({ where: { listingId: listing.id } });
  await prisma.service.createMany({
    data: SERVICES.map((s) => ({
      listingId: listing.id,
      title: s.title,
      items: s.items,
      priceLabel: s.priceLabel,
      sortOrder: s.sortOrder,
    })),
  });

  // Mise à jour du téléphone de la company
  await prisma.company.update({
    where: { id: listing.companyId },
    data: {
      phone: "04 93 00 00 00",
      website: "https://plomberie-martin-nice.fr",
    },
  });

  console.log(`✅ Fiche "${listing.company.name}" enrichie`);
  console.log(`   Photos: ${DEMO_PHOTOS.length}`);
  console.log(`   Services: ${SERVICES.length}`);
  console.log(`   Social: WhatsApp, Facebook, Instagram`);
  console.log(`\n→ http://localhost:3100/entreprise/${TARGET_SLUG}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
