import type { CustomerReviewsProps, StatsProps, TrustBadgesProps } from '../types';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? '' : 'text-neutral-200'}>
          &#9733;
        </span>
      ))}
    </span>
  );
}

/**
 * These are vendor-authored testimonial entries, NOT pulled from the real
 * Review model — see CustomerReviewsProps's own doc comment in
 * landing-page-sections.md §4.1. When AI-drafted, the builder is
 * responsible for flagging them before publish (landing-plan.md §5 step
 * 3); this public render has no "flag" to show a shopper (a published
 * page is, by definition, one the vendor already reviewed/approved), so
 * it renders every entry the same way regardless of aiGenerated.
 */
export function CustomerReviewsSection({ props }: { props: CustomerReviewsProps }) {
  const reviews = (props.reviews ?? []).filter((r) => r.name || r.text);
  if (reviews.length === 0) return null;

  return (
    <div className="px-5 py-10 sm:px-8">
      {props.title && (
        <h2 className="mb-6 text-center text-2xl font-bold text-neutral-900 sm:text-3xl">{props.title}</h2>
      )}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3">
        {reviews.map((r, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 p-4">
            <div className="mb-2 flex items-center gap-2.5">
              {r.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-500">
                  {r.name?.[0]?.toUpperCase() || '?'}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-neutral-900">{r.name || 'Customer'}</p>
                {r.rating && <Stars rating={r.rating} />}
              </div>
              {r.timeAgo && <span className="shrink-0 text-[11px] text-neutral-400">{r.timeAgo}</span>}
            </div>
            <p className="text-[13px] leading-relaxed text-neutral-600">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrustBadgesSection({ props }: { props: TrustBadgesProps }) {
  const badges = props.badges ?? [];
  if (badges.length === 0) return null;
  return (
    <div className="px-5 py-8 text-center sm:px-8">
      {props.title && <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">{props.title}</h3>}
      <div className="flex flex-wrap items-center justify-center gap-6">
        {badges.map((b, i) => (
          <span key={i} className="flex flex-col items-center gap-1.5">
            {b.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.imageUrl} alt={b.label || ''} className="h-10 object-contain" />
            )}
            {b.label && <span className="text-[11px] text-neutral-500">{b.label}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

export function StatsSection({ props }: { props: StatsProps }) {
  const stats = props.stats ?? [];
  if (stats.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-around gap-4 px-5 py-8 sm:px-8">
      {stats.map((s, i) => (
        <div key={i} className="text-center">
          <p className="text-2xl font-extrabold text-orange-600 sm:text-3xl">{s.value}</p>
          <p className="mt-0.5 text-[12.5px] text-neutral-500">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
