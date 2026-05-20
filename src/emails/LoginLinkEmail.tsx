import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/Layout";

type Props = {
  loginUrl: string;
  expiresMinutes: number;
};

export default function LoginLinkEmail({ loginUrl, expiresMinutes }: Props) {
  return (
    <EmailLayout preview="Votre lien de connexion LocalPro">
      <Heading style={{ color: "#1A1A1A", fontSize: 24, marginTop: 16 }}>
        Connexion à votre espace
      </Heading>
      <Text style={{ fontSize: 14, color: "#333", lineHeight: 1.6 }}>
        Cliquez sur le bouton ci-dessous pour vous connecter. Ce lien est à usage unique et expire
        dans {expiresMinutes} minutes.
      </Text>
      <Button
        href={loginUrl}
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
        Me connecter
      </Button>
      <Text style={{ fontSize: 12, color: "#888", marginTop: 24, lineHeight: 1.6 }}>
        Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.
      </Text>
      <Text style={{ fontSize: 11, color: "#aaa", marginTop: 8, wordBreak: "break-all" }}>
        {loginUrl}
      </Text>
    </EmailLayout>
  );
}
