/**
 * Génère du contenu éditorial varié par combinaison (métier, ville)
 * pour éviter le duplicate content. Tous les textes sont paramétrables
 * par le slug métier + nom ville + count + nom annuaire.
 */

function hashString(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

// -----------------------------------------------------------------------
// INTRO — 4 variantes
// -----------------------------------------------------------------------
const INTRO_TEMPLATES: Array<(v: IntroVars) => string> = [
  (v) =>
    `Besoin d'un ${v.metierLower} de confiance à ${v.ville} ? Nous avons sélectionné ${v.count} ${v.metierLower}s locaux, tous vérifiés et notés par leurs clients. Comparez leurs spécialités, lisez les avis et demandez un devis gratuit en moins d'une minute. Que ce soit pour une urgence, un projet planifié ou un simple diagnostic, vous trouverez sur ${v.directoryName} le bon professionnel, sans frais caché.`,
  (v) =>
    `Trouver un ${v.metierLower} à ${v.ville} ne devrait pas être une perte de temps. ${v.directoryName} référence ${v.count} ${v.metierLower}s intervenants dans ${v.ville} et aux alentours, classés par priorité, avis et réactivité. Chaque fiche contient les disponibilités, les tarifs indicatifs et un bouton pour contacter directement l'entreprise — aucun intermédiaire, aucun surcoût.`,
  (v) =>
    `${v.ville} compte ${v.count} ${v.metierLower}s actifs sur ${v.directoryName}. Qu'il s'agisse d'une intervention rapide, de travaux plus lourds ou d'un devis préalable, chaque professionnel affiche ses services, ses horaires et les retours de ses clients. Vous envoyez une demande, les pros qualifiés vous recontactent — le tout sans inscription ni engagement.`,
  (v) =>
    `Pour toute demande concernant un ${v.metierLower} à ${v.ville}, comparez les ${v.count} professionnels référencés ci-dessous. Nous privilégions les artisans locaux ayant au moins plusieurs avis clients et une bonne réactivité. Les fiches affichent leurs spécialités, leurs coordonnées et permettent d'envoyer un message gratuit — devis en moins de 24h dans la majorité des cas.`,
];

type IntroVars = {
  metierLower: string;
  ville: string;
  count: number;
  directoryName: string;
};

export function buildIntro(metierLabel: string, ville: string, count: number, directoryName: string): string {
  const seed = hashString(`${metierLabel}:${ville}`);
  const tpl = INTRO_TEMPLATES[seed % INTRO_TEMPLATES.length]!;
  return tpl({
    metierLower: metierLabel.toLowerCase(),
    ville,
    count: Math.max(count, 1),
    directoryName,
  });
}

// -----------------------------------------------------------------------
// PROCESS 3 ÉTAPES
// -----------------------------------------------------------------------
export type ProcessStep = { title: string; body: string };

export function buildProcess(metierLabel: string, ville: string): ProcessStep[] {
  const m = metierLabel.toLowerCase();
  return [
    {
      title: "1. Décrivez votre besoin",
      body: `Expliquez en quelques lignes ce que vous cherchez (type d'intervention, urgence, contraintes particulières). Précisez votre adresse à ${ville} pour recevoir des estimations adaptées à votre situation.`,
    },
    {
      title: "2. Comparez les pros",
      body: `Accédez à la liste des ${m}s de ${ville} triée par note client, priorité et disponibilité. Les fiches affichent les avis, les photos de réalisations, les tarifs indicatifs et les spécialités de chaque entreprise.`,
    },
    {
      title: "3. Envoyez une demande gratuite",
      body: `Contactez directement le pro qui vous convient via le formulaire ou les boutons WhatsApp/téléphone affichés sur sa fiche. Vous recevez un devis sous 24h, sans engagement et sans coût pour vous.`,
    },
  ];
}

// -----------------------------------------------------------------------
// SOUS-SERVICES — par slug catégorie
// -----------------------------------------------------------------------
export type SubService = { title: string; items: string[] };

const SUBSERVICES: Record<string, SubService[]> = {
  plombier: [
    {
      title: "Dépannage urgence",
      items: [
        "Fuite d'eau",
        "Canalisation bouchée",
        "Chauffe-eau en panne",
        "Débouchage WC",
        "Détection de fuite",
      ],
    },
    {
      title: "Installation & rénovation",
      items: [
        "Salle de bain complète",
        "WC suspendu",
        "Robinetterie et mitigeurs",
        "Installation de chaudière",
        "Création d'évacuation",
      ],
    },
    {
      title: "Entretien & mise aux normes",
      items: [
        "Détartrage et entretien chaudière",
        "Mise aux normes installation",
        "Traitement de l'eau",
        "Inspection de réseau",
      ],
    },
  ],
  electricien: [
    {
      title: "Dépannage électrique",
      items: [
        "Court-circuit ou disjoncteur qui saute",
        "Panne totale",
        "Prise hors service",
        "Interrupteur défectueux",
      ],
    },
    {
      title: "Installation & rénovation",
      items: [
        "Mise aux normes complète",
        "Tableau électrique",
        "Éclairage LED intérieur/extérieur",
        "Domotique et volets connectés",
        "Borne de recharge véhicule",
      ],
    },
    {
      title: "Diagnostic & certification",
      items: [
        "Diagnostic Consuel",
        "Mise en conformité NFC 15-100",
        "Audit avant vente",
      ],
    },
  ],
  macon: [
    {
      title: "Gros œuvre",
      items: [
        "Agrandissement / extension",
        "Élévation de murs",
        "Dalle béton",
        "Fondations",
      ],
    },
    {
      title: "Rénovation",
      items: [
        "Ouverture dans un mur porteur",
        "Ravalement de façade",
        "Rejointoyage pierre",
        "Démolition intérieure",
      ],
    },
    {
      title: "Aménagements extérieurs",
      items: [
        "Terrasse béton ou pierre",
        "Muret et clôture",
        "Escaliers extérieurs",
        "Cour et allée",
      ],
    },
  ],
  peintre: [
    {
      title: "Peinture intérieure",
      items: [
        "Murs et plafonds",
        "Peinture boiseries",
        "Enduit et lissage",
        "Peinture décorative",
      ],
    },
    {
      title: "Peinture extérieure & façade",
      items: [
        "Ravalement de façade",
        "Peinture volets et portails",
        "Traitement anti-humidité",
      ],
    },
    {
      title: "Revêtements",
      items: [
        "Pose de papier peint",
        "Pose de toile de verre",
        "Vernis et lasure",
      ],
    },
  ],
  menuisier: [
    {
      title: "Menuiserie intérieure",
      items: [
        "Placards sur mesure",
        "Portes intérieures",
        "Escalier bois",
        "Parquet",
      ],
    },
    {
      title: "Menuiserie extérieure",
      items: [
        "Fenêtres PVC / aluminium / bois",
        "Volets",
        "Portail et clôture bois",
        "Terrasse bois",
      ],
    },
    {
      title: "Agencement sur mesure",
      items: [
        "Cuisine intégrée",
        "Dressing et bibliothèque",
        "Meubles sur plan",
      ],
    },
  ],
};

const GENERIC_SUBSERVICES: SubService[] = [
  {
    title: "Intervention rapide",
    items: ["Diagnostic", "Urgence", "Dépannage sur site"],
  },
  {
    title: "Projets planifiés",
    items: ["Devis sur mesure", "Suivi de chantier", "Accompagnement complet"],
  },
  {
    title: "Conseil & entretien",
    items: ["Conseil personnalisé", "Maintenance régulière", "Audit technique"],
  },
];

export function buildSubServices(metierSlug: string): SubService[] {
  return SUBSERVICES[metierSlug] ?? GENERIC_SUBSERVICES;
}

// -----------------------------------------------------------------------
// FAQ — 6 questions, réponses longues (60-80 mots chacune)
// -----------------------------------------------------------------------
export type Faq = { question: string; answer: string };

export function buildFaq(
  metierLabel: string,
  ville: string,
  count: number,
  directoryName: string,
): Faq[] {
  const m = metierLabel.toLowerCase();
  return [
    {
      question: `Comment choisir un bon ${m} à ${ville} ?`,
      answer: `Vérifiez d'abord les avis clients récents et le nombre d'interventions réalisées. Un bon ${m} à ${ville} est transparent sur ses tarifs, propose un devis écrit gratuit et détaille les prestations. Sur ${directoryName}, les professionnels affichent leur note moyenne, leurs photos de chantiers et leurs spécialités — vous pouvez comparer ${count} ${m}s en quelques minutes.`,
    },
    {
      question: `Quel est le prix moyen d'une intervention de ${m} à ${ville} ?`,
      answer: `Les tarifs d'un ${m} à ${ville} varient selon la nature des travaux, l'urgence et la surface. Un dépannage simple se situe souvent entre 80€ et 150€ hors fournitures, alors qu'une rénovation complète est devisée sur mesure. Demandez toujours plusieurs devis — c'est gratuit et sans engagement via les fiches affichées ci-dessus.`,
    },
    {
      question: `Les ${m}s de ${ville} sont-ils disponibles en urgence ?`,
      answer: `La majorité des ${m}s de ${ville} référencés sur ${directoryName} interviennent en urgence 7j/7. Les fiches indiquent les disponibilités ("Dispo aujourd'hui", "Urgences 24h/24") et les temps de réponse habituels. En cas de fuite, panne ou sinistre, contactez directement le pro via le bouton WhatsApp ou par téléphone pour une intervention dans les heures qui suivent.`,
    },
    {
      question: `Comment obtenir un devis gratuit d'un ${m} à ${ville} ?`,
      answer: `Depuis la fiche du ${m} de votre choix, utilisez le formulaire "Demander un devis gratuit" ou le bouton WhatsApp. Décrivez votre besoin, votre adresse à ${ville} et joignez si possible une photo — le professionnel vous répond généralement sous 24h avec une estimation. Aucune inscription n'est requise pour faire une demande.`,
    },
    {
      question: `Les ${m}s référencés sont-ils certifiés et assurés ?`,
      answer: `Les ${m}s affichant le badge "Certifié" ou "Pro" sur ${directoryName} ont fourni leur attestation de décennale et leurs qualifications (RGE, Qualibat, Qualifelec selon les métiers). Vous pouvez leur demander directement leurs attestations avant toute prestation — c'est un réflexe sain et les professionnels sérieux vous les transmettront sans hésiter.`,
    },
    {
      question: `Quels sont les délais d'intervention d'un ${m} à ${ville} ?`,
      answer: `Pour un dépannage d'urgence, comptez entre 1 et 4 heures selon la charge de travail du ${m}. Pour une intervention planifiée, le délai est généralement de 2 à 7 jours. Les travaux plus importants (rénovation, installation) sont planifiés en concertation. Chaque fiche indique le temps de réponse habituel aux demandes.`,
    },
  ];
}

// -----------------------------------------------------------------------
// Schema.org generators
// -----------------------------------------------------------------------
export function faqSchema(faq: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
