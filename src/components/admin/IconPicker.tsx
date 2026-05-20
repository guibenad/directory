"use client";

import { CategoryIcon } from "@/components/public/ui/CategoryIcon";

const PRESETS = [
  "🔧", "⚡", "🧱", "🎨", "🪚", "🌿", "🔥", "🔑",
  "🏠", "🛁", "🛠️", "🚿", "🪣", "🪟", "🪜", "🪞",
  "🧼", "🧹", "🧽", "🪛", "⚒️", "🚪", "🚰", "💡",
  "🪴", "🌳", "✂️", "🐾", "🩺", "💊", "💉", "🦷",
  "💅", "💇", "💆", "🧴", "🏋️", "🚗", "🏎️", "⛽",
  "🍽️", "🍔", "🍷", "🧁", "☕", "📚", "🎓", "✏️",
];

export function IconPicker({
  slug,
  label,
  icon,
  color,
  onChange,
}: {
  slug: string;
  label: string;
  icon: string | null;
  color: string | null;
  onChange: (patch: { icon?: string | null; color?: string | null }) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <CategoryIcon
          slug={slug || "default"}
          label={label || "Aperçu"}
          icon={icon}
          color={color}
          size={64}
        />
        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
            Aperçu
          </div>
          <div className="mt-1 text-[13.5px] text-text2">
            Pour {label || slug || "cette catégorie"}
          </div>
        </div>

        <label className="block text-[12px] uppercase tracking-wide text-text3">
          Couleur
          <input
            type="color"
            value={color ?? "#f5a623"}
            onChange={(e) => onChange({ color: e.target.value })}
            className="mt-1 h-10 w-16 cursor-pointer rounded-lg border border-border bg-bg3"
          />
        </label>
        <button
          type="button"
          onClick={() => onChange({ color: null })}
          className="text-[11.5px] text-text3 hover:text-text"
        >
          Auto
        </button>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.15em] text-text3">
          <span>Glyph / emoji</span>
          <button
            type="button"
            onClick={() => onChange({ icon: null })}
            className="normal-case tracking-normal text-text3 hover:text-text"
          >
            Par défaut
          </button>
        </div>

        <div className="grid grid-cols-12 gap-1 rounded-lg border border-border bg-bg3 p-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange({ icon: p })}
              className={[
                "flex h-8 w-8 items-center justify-center rounded-md text-[16px] hover:bg-bg2",
                icon === p ? "bg-bg2 ring-2 ring-amber" : "",
              ].join(" ")}
            >
              {p}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Ou tape n'importe quel emoji / caractère"
          value={icon ?? ""}
          onChange={(e) => onChange({ icon: e.target.value || null })}
          maxLength={4}
          className="mt-2 w-full rounded-lg border border-border bg-bg3 px-3 py-2 text-center text-[18px] text-text outline-none focus:border-amber"
        />
      </div>
    </div>
  );
}
