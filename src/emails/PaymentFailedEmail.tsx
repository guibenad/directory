import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/Layout";

type Props = {
  companyName: string;
  billingPortalUrl: string;
};

export default function PaymentFailedEmail({ companyName, billingPortalUrl }: Props) {
  return (
    <EmailLayout preview="Problème de paiement sur votre abonnement LocalPro">
      <Heading style={{ color: "#B00020", fontSize: 22, marginTop: 16 }}>
        Paiement échoué — votre fiche est suspendue
      </Heading>
      <Text style={{ fontSize: 14, color: "#333", lineHeight: 1.6 }}>
        Bonjour {companyName}, nous n'avons pas pu prélever votre abonnement après 3 tentatives.
        Votre fiche est temporairement masquée dans l'annuaire.
      </Text>
      <Text style={{ fontSize: 14, color: "#333", lineHeight: 1.6 }}>
        Mettez à jour votre moyen de paiement pour réactiver votre fiche immédiatement.
      </Text>
      <Button
        href={billingPortalUrl}
        style={{
          background: "#1A1A1A",
          color: "#fff",
          padding: "12px 20px",
          borderRadius: 8,
          fontWeight: 700,
          textDecoration: "none",
          display: "inline-block",
          marginTop: 16,
        }}
      >
        Mettre à jour mon paiement
      </Button>
    </EmailLayout>
  );
}
