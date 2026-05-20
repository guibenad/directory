import Link from "next/link";
import { CategoryIcon } from "@/components/public/ui/CategoryIcon";
import { Stars } from "@/components/public/ui/Stars";
import { Badge } from "@/components/public/ui/Badge";

export type ListingCardData = {
  id: string;
  slug: string;
  companyName: string;
  companyPhone: string | null;
  category: { slug: string; label: string; icon?: string | null; color?: string | null };
  ville: string;
  villeLabel: string | null;
  address: string | null;
  rating: number;
  reviewCount: number;
  planKey: string | null;
};

export function ListingCard({
  listing,
  showCategory = true,
  animationDelay = 0,
}: {
  listing: ListingCardData;
  showCategory?: boolean;
  animationDelay?: number;
}) {
  const variant =
    listing.planKey === "PRO" ? "pro" : listing.planKey === "ESSENTIEL" ? "certifie" : null;
  const showPhone = listing.planKey !== "STARTER";

  return (
    <Link
      href={`/entreprise/${listing.slug}` as never}
      className="card-lift relative flex flex-col rounded-2xl border border-[color:var(--mist)] bg-white p-5"
      style={{ animationDelay: `${Math.min(animationDelay, 300)}ms` }}
    >
      {variant ? (
        <div className="absolute right-4 top-4">
          <Badge variant={variant} />
        </div>
      ) : null}

      <div className="mb-4 flex items-center gap-3">
        <CategoryIcon
          slug={listing.category.slug}
          label={listing.category.label}
          icon={listing.category.icon}
          color={listing.category.color}
          size={48}
        />
        <div className="min-w-0">
          <div className="truncate font-syne text-[16px] font-bold leading-tight text-[color:var(--ink)]">
            {listing.companyName}
          </div>
          <div className="truncate text-[12.5px] text-[color:var(--mute)]">
            {showCategory ? `${listing.category.label} · ` : ""}
            {listing.villeLabel ?? listing.ville}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[13px]">
        {listing.reviewCount > 0 ? (
          <Stars rating={listing.rating} showValue />
        ) : (
          <span className="text-[color:var(--mute-2)]">Pas encore d'avis</span>
        )}
        {listing.reviewCount > 0 ? (
          <span className="text-[color:var(--mute)]">{listing.reviewCount} avis</span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-2 text-[13px] text-[color:var(--ink-3)]">
        {listing.address ? (
          <div className="flex items-center gap-2">
            <IconPin />
            <span className="truncate">{listing.address}</span>
          </div>
        ) : null}
        {showPhone && listing.companyPhone ? (
          <div className="flex items-center gap-2">
            <IconPhone />
            <span>{listing.companyPhone}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[color:var(--mist)] pt-4 text-[13px]">
        <span className="inline-flex items-center gap-1 text-[color:var(--success)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--success)] pulse-dot" />
          Dispo
        </span>
        <span className="font-medium text-[color:var(--ink-2)]">Voir la fiche →</span>
      </div>
    </Link>
  );
}

function IconPin() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 22s-7-7.5-7-13a7 7 0 0 1 14 0c0 5.5-7 13-7 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L7.9 9.8a16 16 0 0 0 6 6l1.4-1.3a2 2 0 0 1 2-.4c.9.3 1.8.5 2.6.6a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}
