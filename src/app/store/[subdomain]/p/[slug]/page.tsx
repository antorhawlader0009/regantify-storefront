// The short product address (2026-10-16): {store}/p/<slug> is the same page as {store}/product/<slug>, and the one the
// product page's canonical link, the sitemap and the Facebook feed name. middleware.ts sends the old long forms here.
export { default, generateMetadata } from '../../product/[slug]/page';
