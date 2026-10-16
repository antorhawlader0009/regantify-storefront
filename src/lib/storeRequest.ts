import { cache } from 'react';
import { decodeStoreSegment, type StoreAddress } from './storeAddress';

/**
 * Server pages' side of lib/storeAddress.ts (PERFORMANCE-PLAN.md Step 8). Every store page, layout and generateMetadata
 * reads its params through `storeParams`, which hands back the plain subdomain and remembers the address for this one
 * render (React's `cache` is per request), so `siteUrl()` can build absolute links without reading the request.
 */
const current = cache((): { address: StoreAddress | null | undefined } => ({ address: undefined }));

export async function storeParams<T extends { subdomain: string }>(params: Promise<T>): Promise<T> {
  const p = await params;
  const { subdomain, address } = decodeStoreSegment(p.subdomain);
  current().address = address;
  return { ...p, subdomain };
}

/** The address remembered by `storeParams` in this render: undefined when nothing set it, null for "read the request". */
export function currentStoreAddress(): StoreAddress | null | undefined {
  return current().address;
}
