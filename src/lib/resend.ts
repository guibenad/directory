import { Resend } from "resend";
import { render } from "@react-email/render";
import WelcomeEmail from "@/emails/WelcomeEmail";
import NewMessageEmail from "@/emails/NewMessageEmail";
import PaymentFailedEmail from "@/emails/PaymentFailedEmail";
import TrialEndingEmail from "@/emails/TrialEndingEmail";
import MonthlyRecapEmail from "@/emails/MonthlyRecapEmail";
import CancellationEmail from "@/emails/CancellationEmail";
import LoginLinkEmail from "@/emails/LoginLinkEmail";

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;
export const RESEND_FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@localpro.fr";
const SITE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

async function send(params: { to: string; subject: string; html: string }): Promise<void> {
  if (!resend) {
    console.warn(`[resend] stub — ${params.subject} → ${params.to}`);
    return;
  }
  await resend.emails.send({
    from: RESEND_FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}

export async function sendWelcomeEmail(to: string, companyName: string): Promise<void> {
  const html = await render(
    WelcomeEmail({ companyName, dashboardUrl: `${SITE_URL}/dashboard` }),
  );
  await send({ to, subject: "Bienvenue sur LocalPro", html });
}

export async function sendNewMessageEmail(params: {
  to: string;
  companyName: string;
  senderName: string;
  senderEmail: string;
  content: string;
}): Promise<void> {
  const html = await render(
    NewMessageEmail({
      companyName: params.companyName,
      senderName: params.senderName,
      senderEmail: params.senderEmail,
      content: params.content,
    }),
  );
  await send({
    to: params.to,
    subject: `Nouveau message de ${params.senderName} — LocalPro`,
    html,
  });
}

export async function sendTrialEndingEmail(
  to: string,
  companyName: string,
  daysLeft: number,
): Promise<void> {
  const html = await render(
    TrialEndingEmail({
      companyName,
      daysLeft,
      billingPortalUrl: `${SITE_URL}/mon-compte/abonnement`,
    }),
  );
  await send({
    to,
    subject: `Votre essai LocalPro se termine dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`,
    html,
  });
}

export async function sendMonthlyRecapEmail(params: {
  to: string;
  companyName: string;
  monthLabel: string;
  messages: number;
  viewsEstimate: number;
}): Promise<void> {
  const html = await render(MonthlyRecapEmail(params));
  await send({
    to: params.to,
    subject: `Récap ${params.monthLabel} — LocalPro`,
    html,
  });
}

export async function sendCancellationEmail(
  to: string,
  companyName: string,
  endDate: Date,
): Promise<void> {
  const html = await render(
    CancellationEmail({
      companyName,
      endDate: endDate.toLocaleDateString("fr-FR"),
    }),
  );
  await send({
    to,
    subject: "Annulation confirmée — LocalPro",
    html,
  });
}

export async function sendLoginLinkEmail(params: {
  to: string;
  loginUrl: string;
  expiresMinutes: number;
}): Promise<void> {
  const html = await render(
    LoginLinkEmail({ loginUrl: params.loginUrl, expiresMinutes: params.expiresMinutes }),
  );
  if (!resend) {
    console.warn(`[resend] stub — Connexion LocalPro → ${params.to}\n${params.loginUrl}`);
    return;
  }
  await send({ to: params.to, subject: "Votre lien de connexion — LocalPro", html });
}

export async function sendPaymentFailedEmail(to: string, companyName: string): Promise<void> {
  const html = await render(
    PaymentFailedEmail({
      companyName,
      billingPortalUrl: `${SITE_URL}/dashboard/abonnement`,
    }),
  );
  await send({
    to,
    subject: "Problème de paiement — LocalPro",
    html,
  });
}
