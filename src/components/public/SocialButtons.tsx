type Props = {
  whatsapp?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  phone?: string | null;
  /** Message pré-rempli WhatsApp optionnel */
  whatsappMessage?: string;
  className?: string;
};

function whatsappHref(number: string, message?: string): string {
  const clean = number.replace(/[^0-9]/g, "");
  const suffix = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${clean}${suffix}`;
}

export function SocialButtons({
  whatsapp,
  facebook,
  instagram,
  phone,
  whatsappMessage,
  className = "",
}: Props) {
  const items: { href: string; label: string; icon: React.ReactNode; bg: string; fg: string }[] = [];

  if (whatsapp) {
    items.push({
      href: whatsappHref(whatsapp, whatsappMessage),
      label: "WhatsApp",
      icon: <IconWhatsapp />,
      bg: "#25D366",
      fg: "#fff",
    });
  }
  if (phone) {
    items.push({
      href: `tel:${phone.replace(/\s/g, "")}`,
      label: "Appeler",
      icon: <IconPhone />,
      bg: "#1A1A1A",
      fg: "#fff",
    });
  }
  if (facebook) {
    items.push({
      href: facebook,
      label: "Facebook",
      icon: <IconFacebook />,
      bg: "#1877F2",
      fg: "#fff",
    });
  }
  if (instagram) {
    items.push({
      href: instagram,
      label: "Instagram",
      icon: <IconInstagram />,
      bg: "linear-gradient(135deg, #F58529, #DD2A7B 45%, #8134AF 75%, #515BD4)",
      fg: "#fff",
    });
  }

  if (items.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((it) => (
        <a
          key={it.label}
          href={it.href}
          target={it.href.startsWith("http") ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium shadow-sm transition-transform hover:-translate-y-[1px]"
          style={{ background: it.bg, color: it.fg }}
        >
          <span className="flex h-4 w-4 items-center justify-center">{it.icon}</span>
          {it.label}
        </a>
      ))}
    </div>
  );
}

function IconWhatsapp() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M17.5 14.4c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.7.2s-.8.9-1 1.1c-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.7.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5s-.7-1.7-1-2.3c-.3-.6-.6-.5-.7-.5H7c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 2-1.4.2-.6.2-1.2.2-1.3-.1-.2-.3-.3-.6-.5zM12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20z" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2A20 20 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L7.9 9.8a16 16 0 0 0 6 6l1.4-1.3a2 2 0 0 1 2-.4c.9.3 1.8.5 2.6.6A2 2 0 0 1 22 16.9z" />
    </svg>
  );
}
function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M13 22v-8h3l1-4h-4V7.5c0-1.1.3-2 2-2h2V2.2C16.6 2 15.4 2 14.4 2 11.4 2 9 3.8 9 7v3H6v4h3v8h4z" />
    </svg>
  );
}
function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}
