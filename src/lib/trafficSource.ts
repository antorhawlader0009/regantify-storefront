// Where a shopper came from, for the vendor's Analytics > Marketing tab
// (analytics-plan.md Step 3). Recorded once per browser session per
// store, from the first page they land on, and sent with the visit
// beacon (VisitBeacon.tsx) and with checkout (useCheckout.ts). The
// server sorts it into a channel (server/src/analytics/traffic-channel.ts).
// No cookies and nothing personal: just the UTM tags and the referring
// site, in sessionStorage.

export interface TrafficSource {
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
}

const storageKey = (subdomain: string) => `regantify-traffic:${subdomain}`;

function param(params: URLSearchParams, name: string): string | undefined {
  return params.get(name)?.trim().slice(0, 200) || undefined;
}

/** The referring page, only when it's another site (moving around the store isn't a source). */
function externalReferrer(): string | undefined {
  if (!document.referrer) return undefined;
  try {
    return new URL(document.referrer).host === window.location.host ? undefined : document.referrer.slice(0, 2000);
  } catch {
    return undefined;
  }
}

/** Source from the landing URL: UTM tags, else an ad click id. Null when the URL carries neither. */
function fromUrl(referrer: string | undefined): TrafficSource | null {
  const params = new URLSearchParams(window.location.search);
  const utm = { source: param(params, 'utm_source'), medium: param(params, 'utm_medium'), campaign: param(params, 'utm_campaign') };
  if (utm.source || utm.medium || utm.campaign) return utm;
  if (params.has('gclid')) return { source: 'google', medium: 'cpc' };
  if (params.has('ttclid')) return { source: 'tiktok', medium: 'cpc' };
  // Facebook and Instagram both add fbclid; the referrer tells them apart.
  if (params.has('fbclid')) return { source: referrer && /instagram/i.test(referrer) ? 'instagram' : 'facebook' };
  return null;
}

/**
 * Records this session's source if it isn't known yet, or replaces it
 * when the shopper arrives through a new tagged link (a second ad).
 * Returns what's stored. Never throws: sessionStorage can be unavailable
 * in some private modes, and a source is never worth breaking the page.
 */
export function captureTrafficSource(subdomain: string): TrafficSource {
  try {
    const referrer = externalReferrer();
    const tagged = fromUrl(referrer);
    const stored = sessionStorage.getItem(storageKey(subdomain));
    if (!tagged && stored) return JSON.parse(stored) as TrafficSource;

    const source: TrafficSource = tagged ? { ...tagged, referrer } : { referrer };
    sessionStorage.setItem(storageKey(subdomain), JSON.stringify(source));
    return source;
  } catch {
    return {};
  }
}
