type Props = {
  slug: string;
  label: string;
  /** Emoji ou glyph custom (override le mapping par défaut) */
  icon?: string | null;
  /** Couleur de fond custom (hex). Override la teinte hsl dérivée du slug. */
  color?: string | null;
  className?: string;
  size?: number;
};

const GLYPHS: Record<string, string> = {
  plombier: "🔧",
  electricien: "⚡",
  macon: "🧱",
  peintre: "🎨",
  menuisier: "🪚",
  jardinier: "🌿",
  chauffagiste: "🔥",
  serrurier: "🔑",
  carreleur: "▨",
  couvreur: "🏠",
  default: "◆",
};

function slugToHue(slug: string): number {
  let hash = 0;
  for (const c of slug) hash = (hash * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(hash) % 360;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function CategoryIcon({ slug, label, icon, color, size = 48, className = "" }: Props) {
  const glyph = icon || GLYPHS[slug] || GLYPHS.default;

  let background: string;
  let ring: string;
  if (color) {
    const rgb = hexToRgb(color);
    if (rgb) {
      background = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.12)`;
      ring = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.22)`;
    } else {
      background = color;
      ring = "rgba(0,0,0,0.08)";
    }
  } else {
    const hue = slugToHue(slug);
    background = `hsl(${hue} 70% 94%)`;
    ring = `hsl(${hue} 60% 60%)`;
  }

  return (
    <div
      className={`flex items-center justify-center rounded-[14px] ${className}`}
      style={{
        width: size,
        height: size,
        background,
        boxShadow: `inset 0 0 0 1px ${ring}${color ? "" : "22"}`,
      }}
      aria-label={label}
    >
      <span style={{ fontSize: size * 0.5, lineHeight: 1 }}>{glyph}</span>
    </div>
  );
}
