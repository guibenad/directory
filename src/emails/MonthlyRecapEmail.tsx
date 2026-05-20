import { Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/Layout";

type Props = {
  companyName: string;
  monthLabel: string;
  messages: number;
  viewsEstimate: number;
};

export default function MonthlyRecapEmail({
  companyName,
  monthLabel,
  messages,
  viewsEstimate,
}: Props) {
  return (
    <EmailLayout preview={`Récap ${monthLabel} — votre activité sur LocalPro`}>
      <Heading style={{ color: "#1A1A1A", fontSize: 22, marginTop: 16 }}>
        Votre récap {monthLabel}
      </Heading>
      <Text style={{ fontSize: 14, color: "#333", lineHeight: 1.6 }}>
        Bonjour {companyName}, voici un résumé de votre activité ce mois-ci.
      </Text>

      <Section style={{ display: "flex", gap: 12, margin: "16px 0" }}>
        <Metric label="Messages reçus" value={messages} />
        <Metric label="Vues estimées" value={viewsEstimate} />
      </Section>

      <Text style={{ fontSize: 13, color: "#555" }}>
        Merci de votre confiance — continuez à développer votre activité avec LocalPro.
      </Text>
    </EmailLayout>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        flex: 1,
        background: "#F5F5F0",
        borderRadius: 10,
        padding: 16,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 800, color: "#F5A623" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{label}</div>
    </div>
  );
}
