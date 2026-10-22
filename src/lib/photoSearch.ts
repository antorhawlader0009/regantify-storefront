'use client';

import type { ClipboardEvent as ReactClipboardEvent } from 'react';
import { create } from 'zustand';
import type { StorefrontProduct } from './storefrontApi';

/**
 * Search the store by photo: the search bar's camera button, a picture pasted into the search box, or a picture dropped
 * anywhere on the store (components/PhotoSearchDrop.tsx). Shared by every template; a template only draws the results
 * (StorePal: themes/storepal/components/PhotoSearchPanel.tsx).
 *
 * The photo is shrunk here (512 px JPEG) and matched by the server with the store's own product photos by picture
 * fingerprint (POST /v1/store/:subdomain/search/photo). No AI is involved and the photo is not kept. The cards come from
 * products/by-slugs, so prices and stock are today's.
 */

function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

const SIDE = 512;
/** Bigger files are refused before they are opened (a phone photo is a few MB). */
const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function isImageFile(file: File | null | undefined): file is File {
  return !!file && file.type.startsWith('image/');
}

async function shrink(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // A transparent PNG would turn black as JPEG: white behind it, like a product photo.
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  }
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.8);
}

export type PhotoSearchStatus = 'idle' | 'searching' | 'done' | 'error';

interface PhotoSearchState {
  open: boolean;
  status: PhotoSearchStatus;
  /** A local preview address of the photo searched for. */
  preview: string | null;
  products: StorefrontProduct[];
  /** Similar products under the matches (same category, brand or name words; chosen by the server, no AI). */
  related: StorefrontProduct[];
  error: string | null;
  search: (subdomain: string, file: File) => Promise<void>;
  close: () => void;
}

let runId = 0;

export const usePhotoSearch = create<PhotoSearchState>((set, get) => ({
  open: false,
  status: 'idle',
  preview: null,
  products: [],
  related: [],
  error: null,

  search: async (subdomain, file) => {
    if (!isImageFile(file)) return;
    const id = ++runId;
    const old = get().preview;
    if (old) URL.revokeObjectURL(old);
    set({ open: true, status: 'searching', preview: URL.createObjectURL(file), products: [], related: [], error: null });
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error('This photo is too large. Please try a smaller one.');
      const photo = await shrink(file);
      const res = await fetch(`${apiOrigin()}/v1/store/${encodeURIComponent(subdomain)}/search/photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = Array.isArray(body?.message) ? body.message[0] : body?.message;
        throw new Error(res.status === 429 ? 'Too many photo searches. Please wait a minute.' : msg || 'Could not search with this photo.');
      }
      const { slugs, related = [] } = (await res.json()) as { slugs: string[]; related?: string[] };
      // Cards in the server's order (best first), at today's price. by-slugs takes 12 at most, so two calls.
      const cards = async (list: string[]): Promise<StorefrontProduct[]> => {
        if (!list.length) return [];
        const r = await fetch(`${apiOrigin()}/v1/store/${encodeURIComponent(subdomain)}/products/by-slugs?slugs=${encodeURIComponent(list.join(','))}`);
        const data = (r.ok ? await r.json() : { products: [] }) as { products?: StorefrontProduct[] };
        const bySlug = new Map((data.products ?? []).map((p) => [p.slug, p]));
        return list.map((s) => bySlug.get(s)).filter((p): p is StorefrontProduct => !!p);
      };
      const [products, relatedCards] = await Promise.all([cards(slugs), cards(related).catch(() => [])]);
      if (id === runId) set({ status: 'done', products, related: relatedCards });
    } catch (err) {
      if (id === runId) set({ status: 'error', error: err instanceof Error ? err.message : 'Could not search with this photo.' });
    }
  },

  close: () => {
    runId++;
    const old = get().preview;
    if (old) URL.revokeObjectURL(old);
    set({ open: false, status: 'idle', preview: null, products: [], related: [], error: null });
  },
}));

/** The first image in a paste (a screenshot copied to the clipboard), or null. */
export function imageFromClipboard(e: ClipboardEvent | ReactClipboardEvent): File | null {
  for (const item of Array.from(e.clipboardData?.items ?? [])) {
    if (item.kind === 'file' && item.type.startsWith('image/')) return item.getAsFile();
  }
  return null;
}
