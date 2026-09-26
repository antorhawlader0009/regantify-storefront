import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStoreProducts, StoreNotFoundError, type StorefrontProduct } from '@/lib/storefrontApi';
import { resolveTheme } from '@/lib/theme';

// Store > Integrations > Facebook Pixel's Catalog Feed, at
// {store}/feed/facebook-catalog (the dashboard shows this URL). The vendor
// pastes it into Meta Commerce Manager as a scheduled data feed, which is
// what catalog ads (Advantage+ catalog / dynamic retargeting) build from.
// See facebook-pixel.md §7 for the field mapping.
//
// Every row's id matches the pixel's content_ids (lib/metaPixelEvents.ts):
// the product id, or for a product with variants one row per variant (id =
// variant id) grouped by item_group_id = product id, which is what the
// pixel's content_type "product_group" matches against. StorePal only,
// like the rest of the integration. Built from the same public product
// data the store renders (Public products only, campaign prices applied).

const ROOT_DOMAIN = process.env.ROOT_DOMAIN?.toLowerCase().trim();
const CURRENCY = 'BDT';

const COLUMNS = [
  'id',
  'title',
  'description',
  'availability',
  'condition',
  'price',
  'sale_price',
  'link',
  'image_link',
  'additional_image_link',
  'brand',
  'product_type',
  'item_group_id',
  'color',
  'size',
] as const;
type Row = Partial<Record<(typeof COLUMNS)[number], string>>;

export async function GET(_request: Request, { params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;

  let data;
  try {
    data = await getStoreProducts(subdomain);
  } catch (err) {
    if (err instanceof StoreNotFoundError) return new NextResponse('Not found', { status: 404 });
    throw err;
  }
  const { store, products } = data;
  if (resolveTheme(store.theme) !== 'STOREPAL') return new NextResponse('Not found', { status: 404 });

  const productUrl = await productUrlBuilder(subdomain);
  const allowBackorder = store.stockSettings?.allowBackorder === true;
  const rows = products.flatMap((p) => productRows(p, store.storeName, productUrl(p.slug), allowBackorder));

  const csv = [COLUMNS.join(','), ...rows.map((r) => COLUMNS.map((c) => csvCell(r[c] ?? '')).join(','))].join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      // Meta fetches it on its own schedule (hourly at most); a short
      // cache just absorbs repeated fetches.
      'Cache-Control': 'public, max-age=900',
    },
  });
}

function productRows(p: StorefrontProduct, storeName: string, link: string, allowBackorder: boolean): Row[] {
  // Meta rejects items without an image.
  if (p.photoUrls.length === 0) return [];

  const base: Row = {
    title: p.name.slice(0, 200),
    description: plainText(p.description) || plainText(p.summary) || p.name,
    condition: 'new',
    link,
    brand: (p.brand?.trim() || storeName).slice(0, 100),
    product_type: p.category ?? '',
  };

  if (p.variants.length === 0) {
    const inStock = p.stockQuantity === null || p.stockQuantity === undefined || p.stockQuantity > 0;
    return [
      {
        ...base,
        id: p.id,
        availability: availability(p.isPreOrder, inStock, allowBackorder),
        ...prices(Number(p.price), p.discountPrice != null ? Number(p.discountPrice) : null),
        image_link: p.photoUrls[0],
        additional_image_link: p.photoUrls.slice(1, 21).join(','),
      },
    ];
  }

  return p.variants.map((v) => {
    const options = Object.entries(v.optionValues);
    // Same price precedence as the product page's purchase panel.
    const listPrice = v.listPrice != null ? Number(v.listPrice) : Number(p.price);
    const salePrice =
      v.discountPrice != null
        ? Number(v.discountPrice)
        : v.listPrice == null && p.discountPrice != null
          ? Number(p.discountPrice)
          : null;
    const photos = variantPhotos(p, options);
    return {
      ...base,
      id: v.id,
      item_group_id: p.id,
      title: `${p.name} - ${options.map(([, value]) => value).join(' / ')}`.slice(0, 200),
      availability: availability(p.isPreOrder, v.stock > 0, allowBackorder),
      ...prices(listPrice, salePrice),
      image_link: photos[0],
      additional_image_link: photos.slice(1, 21).join(','),
      color: optionValue(options, /^colou?r$/i),
      size: optionValue(options, /^size$/i),
    };
  });
}

function availability(isPreOrder: boolean, inStock: boolean, allowBackorder: boolean) {
  if (isPreOrder) return 'preorder';
  // Store > Stock Settings' backorder keeps sold-out items orderable.
  return inStock || allowBackorder ? 'in stock' : 'out of stock';
}

/**
 * "1200.00 BDT". The store charges the discount price whenever one is set
 * (even a mistyped one that isn't lower), and Meta rejects items whose
 * feed price doesn't match the page, so: a real discount goes out as
 * price + sale_price, any other set discount price as the price itself.
 */
function prices(listPrice: number, salePrice: number | null): Row {
  const fmt = (n: number) => `${n.toFixed(2)} ${CURRENCY}`;
  if (salePrice == null) return { price: fmt(listPrice) };
  if (salePrice < listPrice) return { price: fmt(listPrice), sale_price: fmt(salePrice) };
  return { price: fmt(salePrice) };
}

/** A variant's own option photos (e.g. the Red color's photos) first, then the product's. */
function variantPhotos(p: StorefrontProduct, options: [string, string][]): string[] {
  const own = (p.variationPhotos ?? [])
    .filter((vp) => options.some(([name, value]) => same(vp.optionName, name) && same(vp.optionValue, value)))
    .flatMap((vp) => vp.photoUrls);
  return Array.from(new Set([...own, ...p.photoUrls]));
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function optionValue(options: [string, string][], name: RegExp): string {
  return options.find(([optionName]) => name.test(optionName.trim()))?.[1] ?? '';
}

/** The rich-text description as plain text (Meta wants no HTML), within Meta's 9,999-char limit. */
function plainText(html: string | null | undefined): string {
  if (!html) return '';
  // Every tag becomes a space, so table cells and list items don't run together.
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 9999);
}

/** Quoted CSV cell; newlines flattened so each item stays on one line. */
function csvCell(value: string): string {
  return `"${value.replace(/[\r\n]+/g, ' ').replace(/"/g, '""')}"`;
}

/**
 * Product links on the host the feed was fetched from. On a vendor's own
 * domain or {subdomain}.ROOT_DOMAIN the middleware maps /product/... to
 * this store, so links use the short form; on localhost/an IP (dev/LAN)
 * or the bare root domain they need the /store/{subdomain} prefix.
 */
async function productUrlBuilder(subdomain: string): Promise<(slug: string) => string> {
  const h = await headers();
  const hostHeader = h.get('host') ?? '';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = hostHeader.toLowerCase().split(':')[0];
  const isLocal = /^(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)$/.test(host) || host.endsWith('.local');
  const isRootDomain = !!ROOT_DOMAIN && (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`);
  const prefix = isLocal || isRootDomain || !host ? `/store/${subdomain}` : '';
  return (slug) => `${proto}://${hostHeader}${prefix}/product/${encodeURIComponent(slug)}`;
}
