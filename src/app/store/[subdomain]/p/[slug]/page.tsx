// The short product address (2026-10-16): {store}/p/<slug> is the same page as {store}/product/<slug>, and the one the
// product page's canonical link, the sitemap and the Facebook feed name. middleware.ts sends the old long forms here.
// generateStaticParams too: without it the short address (the one a store's own address uses) was rendered on every
// visit while the long one was kept (found 2026-10-24).
export { default, generateMetadata, generateStaticParams } from '../../product/[slug]/page';
