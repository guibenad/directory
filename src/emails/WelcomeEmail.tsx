import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/Layout";

type Props = {
  companyName: string;
  dashboardUrl: string;
};

export default function WelcomeEmail({ companyName, dashboardUrl }: Props) {
  return (
    <EmailLayout preview="Bienvenue sur LocalPro — votre fiche est active">
      <Heading style={{ color: "#1A1A1A", fontSize: 24, marginTop: 16 }}>
        Bienvenue, {companyName} 👋
      </Heading>
      <Text style={{ fontSize: 14, color: "#333", lineHeight: 1.6 }}>
        Votre abonnement est actif et votre fiche est désormais publiée dans l'annuaire LocalPro.
        Vous bénéficiez de 14 jours gratuits avant le premier prélèvement.
      </Text>
      <Button
        href={dashboardUrl}
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
        Accéder à mon espace
      </Button>
    </EmailLayout>
  );
}
