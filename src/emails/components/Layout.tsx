import { Body, Container, Head, Html, Preview, Section, Text } from "@react-email/components";

type Props = {
  preview: string;
  children: React.ReactNode;
};

export function EmailLayout({ preview, children }: Props) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#F5F5F0", margin: 0, fontFamily: "Arial, sans-serif" }}>
        <Container style={{ maxWidth: 560, margin: "24px auto", background: "#fff", borderRadius: 12, padding: 32 }}>
          <Section>
            <Text style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1A1A1A" }}>
              Local<span style={{ color: "#F5A623" }}>Pro</span>
            </Text>
          </Section>
          {children}
          <Section style={{ marginTop: 32, borderTop: "1px solid #E8E8E0", paddingTop: 16 }}>
            <Text style={{ fontSize: 12, color: "#999", margin: 0 }}>
              LocalPro — Annuaire des artisans et professionnels
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
