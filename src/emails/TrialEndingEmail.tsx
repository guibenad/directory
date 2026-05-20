import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/Layout";

type Props = {
  companyName: string;
  daysLeft: number;
  billingPortalUrl: string;
};

export default function TrialEndingEmail({ companyName, daysLeft, billingPortalUrl }: Props) {
  return (
    <EmailLayout preview="Votre essai gratuit LocalPro se termine bientôt">
      <Heading style={{ color: "#1A1A1A", fontSize: 22, marginTop: 16 }}>
        Votre essai se termine dans {daysLeft} jour{daysLeft > 1 ? "s" : ""}
      </Heading>
      <Text style={{ fontSize: 14, color: "#333", lineHeight: 1.6 }}>
        Bonjour {companyName}, votre période d'essai gratuite arrive bientôt à son terme. Le
        premier prélèvement aura lieu à la date de fin de l'essai, sauf si vous annulez.
      </Text>
      <Button
        href={billingPortalUrl}
        style={{
          background: "#F5A623",
          color: "#1A1A1A",
          padding: "12px 20px",
          borderRadius: 8,
          fontWeight: 700,
          textDecoration: "none",
          display: "inline-block",
          marginTop: 16,
        }}
      >
        Gérer mon abonnement
      </Button>
    </EmailLayout>
  );
}
