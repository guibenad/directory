export function Stars({ rating, showValue }: { rating: number; showValue?: boolean }) {
  const clamped = Math.max(0, Math.min(5, rating));
  const full = Math.floor(clamped);
  const hasHalf = clamped - full >= 0.5;
  return (
    <span className="inline-flex items-center gap-1 text-[14px]" aria-label={`${clamped} sur 5`}>
      <span aria-hidden className="tracking-[2px] text-[color:var(--accent)]">
        {"★".repeat(full)}
        {hasHalf ? "⯪" : ""}
        <span className="text-[color:var(--mist-2)]">{"★".repeat(5 - full - (hasHalf ? 1 : 0))}</span>
      </span>
      {showValue ? <span className="text-[13px] text-[color:var(--mute)]">{clamped.toFixed(1)}</span> : null}
    </span>
  );
}
