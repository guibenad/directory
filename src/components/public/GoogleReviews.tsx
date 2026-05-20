import { Stars } from "@/components/public/ui/Stars";

export type GoogleReviewData = {
  authorName: string;
  authorUrl?: string;
  authorPhotoUrl?: string;
  rating: number;
  relativeTime: string;
  text: string;
  time: number;
};

type Props = {
  rating: number | null;
  reviewCount: number | null;
  mapsUrl: string | null;
  reviews: GoogleReviewData[];
};

export function GoogleReviews({ rating, reviewCount, mapsUrl, reviews }: Props) {
  if (!rating && reviews.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--mute)]">
            <GoogleLogo />
            <span>Avis Google</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-syne text-[28px] font-extrabold text-[color:var(--ink)]">
              {rating !== null ? rating.toFixed(1) : "—"}
            </span>
            {rating !== null ? <Stars rating={rating} /> : null}
            <span className="text-[13px] text-[color:var(--mute)]">
              · {reviewCount?.toLocaleString("fr-FR") ?? 0} avis
            </span>
          </div>
        </div>
        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-[color:var(--ink-2)] hover-underline"
          >
            Voir tous les avis sur Google ↗
          </a>
        ) : null}
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[color:var(--mist)] bg-white p-6 text-center text-[14px] text-[color:var(--mute)]">
          Aucun avis détaillé disponible pour le moment.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {reviews.map((r) => (
            <li
              key={`${r.authorName}-${r.time}`}
              className="rounded-2xl border border-[color:var(--mist)] bg-white p-5 shadow-[var(--shadow-soft)]"
            >
              <header className="mb-2 flex items-center gap-3">
                {r.authorPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.authorPhotoUrl}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--cream-2)] font-syne text-[13px] font-bold text-[color:var(--ink-2)]">
                    {r.authorName[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-[color:var(--ink)]">
                    {r.authorName}
                  </div>
                  <div className="text-[12px] text-[color:var(--mute)]">{r.relativeTime}</div>
                </div>
                <Stars rating={r.rating} />
              </header>
              <p className="line-clamp-6 text-[14px] leading-[1.6] text-[color:var(--ink-2)]">
                {r.text}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 flex items-center justify-end gap-2 text-[11px] text-[color:var(--mute-2)]">
        <GoogleLogo small />
        Avis fournis par Google
      </p>
    </section>
  );
}

function GoogleLogo({ small }: { small?: boolean }) {
  const size = small ? 12 : 14;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}
