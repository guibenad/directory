type Service = {
  id: string;
  title: string;
  items: string[];
  priceLabel: string | null;
};

export function ServicesBlock({ services }: { services: Service[] }) {
  if (services.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 font-syne text-[22px] font-bold">Services proposés</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {services.map((s) => (
          <article
            key={s.id}
            className="rounded-2xl border border-[color:var(--mist)] bg-white p-5 shadow-[var(--shadow-soft)]"
          >
            <header className="mb-3 flex items-start justify-between gap-2">
              <h3 className="font-syne text-[17px] font-bold leading-tight text-[color:var(--ink)]">
                {s.title}
              </h3>
              {s.priceLabel ? (
                <span className="shrink-0 rounded-full bg-[color:var(--accent-soft)] px-[10px] py-[3px] font-syne text-[11.5px] font-bold text-[#8b5a00]">
                  {s.priceLabel}
                </span>
              ) : null}
            </header>

            {s.items.length > 0 ? (
              <ul className="space-y-1.5">
                {s.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[13.5px] text-[color:var(--ink-2)]"
                  >
                    <span className="mt-[6px] block h-[1.5px] w-[10px] shrink-0 bg-[color:var(--accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
