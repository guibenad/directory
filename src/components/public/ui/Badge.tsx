type Variant = "pro" | "certifie" | "new" | "neutral";

const VARIANTS: Record<Variant, { bg: string; fg: string; label: string; icon?: string }> = {
  pro: { bg: "linear-gradient(135deg, #ffbb3c, #f5a623)", fg: "#1a1a1c", label: "⭐ Pro" },
  certifie: { bg: "#E3F2FD", fg: "#1565C0", label: "✓ Certifié" },
  new: { bg: "#EEF7EE", fg: "#2E8B57", label: "Nouveau" },
  neutral: { bg: "#F2F0EA", fg: "#3a3a3d", label: "" },
};

export function Badge({
  variant = "neutral",
  children,
  className = "",
}: {
  variant?: Variant;
  children?: React.ReactNode;
  className?: string;
}) {
  const v = VARIANTS[variant];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-[10px] py-[3px] font-syne text-[11px] font-bold ${className}`}
      style={{ background: v.bg, color: v.fg }}
    >
      {children ?? v.label}
    </span>
  );
}
