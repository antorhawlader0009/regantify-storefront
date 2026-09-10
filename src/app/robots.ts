import type { MetadataRoute } from 'next';

// Next.js file convention — serves this at /robots.txt automatically,
// no vendor action needed. Allows all storefront pages, blocks the
// checkout flow (no SEO value, and shouldn't be indexed/crawled).
//
// Each vendor's sitemap lives at /store/:subdomain/sitemap.xml (see
// store/[subdomain]/sitemap.xml/route.ts) — there's no single site-wide
// sitemap yet since that needs a public "list all vendors" endpoint the
// API doesn't have (see README). A vendor can submit their own
// /store/:subdomain/sitemap.xml directly in Google Search Console in the
// meantime; it doesn't need to be referenced from this file to work.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/store/*/checkout',
    },
  };
}
