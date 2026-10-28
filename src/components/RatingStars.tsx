import { Star } from 'lucide-react';

/**
 * A product's average rating as five stars plus "4.6 (23)". Shared by every template; each passes its own size and
 * words. The server only sends a rating from enough approved reviews (server storefront/product-rating.ts), so this
 * never draws one for a product without it.
 */
export function RatingStars({
  rating,
  size = 14,
  showCount = true,
  label,
  className = '',
}: {
  rating: { average: number; count: number };
  size?: number;
  showCount?: boolean;
  /** Screen-reader text, e.g. "Rated 4.6 out of 5 from 23 reviews". */
  label: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} aria-label={label} role="img">
      <span className="relative inline-flex" aria-hidden>
        <span className="flex text-line-strong">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={size} fill="currentColor" strokeWidth={0} />
          ))}
        </span>
        {/* The gold part, cut to the average (4.6 -> 92%). */}
        <span className="absolute inset-0 flex overflow-hidden text-amber-400" style={{ width: `${(rating.average / 5) * 100}%` }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={size} fill="currentColor" strokeWidth={0} className="shrink-0" />
          ))}
        </span>
      </span>
      <span aria-hidden className="tabular-nums font-semibold text-ink">{rating.average.toFixed(1)}</span>
      {showCount && <span aria-hidden className="tabular-nums text-muted">({rating.count})</span>}
    </span>
  );
}
