export function Section({
  eyebrow,
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`py-12 ${className}`}>
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          {eyebrow ? (
            <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[color:var(--mute)]">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="font-syne text-[clamp(22px,3vw,32px)] font-bold text-[color:var(--ink)]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-[14.5px] leading-[1.6] text-[color:var(--mute)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
