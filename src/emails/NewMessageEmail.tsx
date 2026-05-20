import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/Layout";

type Props = {
  companyName: string;
  senderName: string;
  senderEmail: string;
  content: string;
};

export default function NewMessageEmail({ companyName, senderName, senderEmail, content }: Props) {
  return (
    <EmailLayout preview={`Nouveau message pour ${companyName}`}>
      <Heading style={{ color: "#1A1A1A", fontSize: 22, marginTop: 16 }}>
        Nouveau message de {senderName}
      </Heading>
      <Text style={{ fontSize: 14, color: "#333", lineHeight: 1.6 }}>
        Vous avez reçu un nouveau message sur votre fiche LocalPro.
      </Text>
      <Text
        style={{
          background: "#F5F5F0",
          borderRadius: 8,
          padding: 16,
          fontSize: 14,
          color: "#1A1A1A",
          whiteSpace: "pre-wrap",
        }}
      >
        {content}
      </Text>
      <Text style={{ fontSize: 13, color: "#555" }}>
        Répondre à <a href={`mailto:${senderEmail}`}>{senderEmail}</a>.
      </Text>
    </EmailLayout>
  );
}
