import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

/**
 * On-demand revalidation endpoint — called by the backend (see
 * server/src/storefront/storefront-revalidate.service.ts) right after
 * any change that affects storefront data: a product created/updated/
 * deleted, or its visibility toggled. Without this, the storefront only
 * picks up changes after the fetch cache's time-based revalidate window
 * (see REVALIDATE_SECONDS in storefrontApi.ts) expires — which reads as
 * "I have to wait or reload" to a vendor who just saved a product. This
 * makes it instant instead.
 *
 * POST /api/revalidate
 * Body: { secret: string, subdomain: string, slug?: string }
 *
 * Always revalidates the store's product list/store-info tag. When a
 * `slug` is given, also revalidates that one product's detail tag —
 * every call from the backend passes a slug except a category-list
 * change, which doesn't affect any single product's detail page.
 */
export async function POST(request: NextRequest) {
  let body: { secret?: string; subdomain?: string; slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body.' }, { status: 400 });
  }

  const expectedSecret = process.env.REVALIDATE_SECRET;
  if (!expectedSecret) {
    // Fails closed: if the secret isn't configured, no request can be
    // trusted, so revalidation is refused rather than silently allowed
    // for anyone who finds this URL.
    return NextResponse.json({ message: 'Revalidation is not configured on this deployment.' }, { status: 503 });
  }
  if (body.secret !== expectedSecret) {
    return NextResponse.json({ message: 'Invalid secret.' }, { status: 401 });
  }

  const subdomain = body.subdomain?.trim();
  if (!subdomain) {
    return NextResponse.json({ message: 'subdomain is required.' }, { status: 400 });
  }

  const revalidated: string[] = [`store:${subdomain}`];
  revalidateTag(`store:${subdomain}`);

  if (body.slug?.trim()) {
    const tag = `store:${subdomain}:product:${body.slug.trim()}`;
    revalidateTag(tag);
    revalidated.push(tag);
  }

  return NextResponse.json({ revalidated: true, tags: revalidated });
}
