import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/Layout";

type Props = {
  companyName: string;
  endDate: string;
};

export default function CancellationEmail({ companyName, endDate }: Props) {
  return (
    <EmailLayout preview="Votre abonnement LocalPro a été annulé">
      <Heading style={{ color: "#1A1A1A", fontSize: 22, marginTop: 16 }}>
        Annulation confirmée
      </Heading>
      <Text style={{ fontSize: 14, color: "#333", lineHeight: 1.6 }}>
        Bonjour {companyName}, votre abonnement LocalPro a bien été annulé. Votre fiche reste
        visible jusqu'au {endDate}.
      </Text>
      <Text style={{ fontSize: 14, color: "#333", lineHeight: 1.6 }}>
        Vous pouvez réactiver votre abonnement à tout moment depuis votre espace entreprise.
      </Text>
    </EmailLayout>
  );
}
