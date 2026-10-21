/**
 * Ordering inside the store's AI chat (server: storefront/chat-order.ts). Shared logic, not tied to one template: the
 * shopper's remembered details, and saving them so they are never asked twice.
 *
 * - Logged in: the details are the account's saved address book on the server (the default address), and a new
 *   address from the chat is added to it (TellMe idea 53, at most 5 addresses).
 * - Not logged in: the details are kept in this browser only (localStorage, the same "remember my details" entry the
 *   checkout form uses), per store.
 */
import { createMyAddress, listMyAddresses, type SavedAddress } from './customerAuthApi';
import { suggestZone } from './deliveryZone';

export interface ChatOrderItem {
  slug: string;
  quantity: number;
  options: Record<string, string>;
  name: string;
  missingOptions: string[];
}

export type ChatOrderMissing = 'product' | 'options' | 'name' | 'phone' | 'address' | 'district';

/** What the server sends back for the order card (StorefrontController.chat). */
export interface ChatOrder {
  items: ChatOrderItem[];
  name: string | null;
  phone: string | null;
  address: string | null;
  district: string | null;
  missing: ChatOrderMissing[];
  ready: boolean;
}

export interface ChatOrderDetails {
  name: string;
  phone: string;
  address: string;
  district: string;
}

const FORM_KEY = 'regantify-checkout-form:';
const PHONE_RE = /^01[3-9]\d{8}$/;

export const isValidBdPhone = (p: string) => PHONE_RE.test(p.replace(/[\s-]/g, '').replace(/^\+?88/, ''));

function readBrowser(subdomain: string): Partial<ChatOrderDetails> {
  try {
    const saved = JSON.parse(localStorage.getItem(`${FORM_KEY}${subdomain}`) ?? '{}') as Record<string, string>;
    return { name: saved.fullName || '', phone: saved.phone || '', address: saved.address || '', district: saved.district || '' };
  } catch {
    return {};
  }
}

function writeBrowser(subdomain: string, d: ChatOrderDetails): void {
  try {
    const key = `${FORM_KEY}${subdomain}`;
    const existing = JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, string>;
    localStorage.setItem(key, JSON.stringify({ ...existing, fullName: d.name, phone: d.phone, address: d.address, district: d.district }));
  } catch {
    // Storage blocked: nothing is remembered, the chat still works.
  }
}

/** The details this shopper gave before: their default saved address when logged in, else what this browser kept. */
export async function rememberedDetails(subdomain: string, accessToken: string | null): Promise<Partial<ChatOrderDetails>> {
  if (accessToken) {
    try {
      const { addresses } = await listMyAddresses(accessToken);
      const a: SavedAddress | undefined = addresses.find((x) => x.isDefault) ?? addresses[0];
      if (a) return { name: a.recipientName, phone: a.phone, address: a.address, district: a.district ?? '' };
    } catch {
      // fall through to the browser copy
    }
  }
  return readBrowser(subdomain);
}

/**
 * Keeps the details for next time. Logged in: added to the account's address book unless an address with the same phone
 * and address is already there (or the book is full). Not logged in: this browser only.
 */
export async function rememberDetails(subdomain: string, d: ChatOrderDetails, accessToken: string | null): Promise<void> {
  if (accessToken) {
    try {
      const { addresses, max } = await listMyAddresses(accessToken);
      const same = (x: string) => x.replace(/\s+/g, ' ').trim().toLowerCase();
      const known = addresses.some((a) => same(a.address) === same(d.address) && a.phone.replace(/\D/g, '').endsWith(d.phone.replace(/\D/g, '').slice(-10)));
      if (!known && addresses.length < max) {
        await createMyAddress(accessToken, {
          label: addresses.length === 0 ? 'Home' : 'From chat',
          recipientName: d.name,
          phone: d.phone,
          address: d.address,
          district: d.district || undefined,
          deliveryZone: suggestZone(d.district, '') === 'DHAKA' ? 'DHAKA' : suggestZone(d.district, '') === 'AROUND_DHAKA' ? 'AROUND_DHAKA' : 'OUTSIDE_DHAKA',
          isDefault: addresses.length === 0,
        });
      }
      return;
    } catch {
      // the server copy failed: keep it in this browser at least
    }
  }
  writeBrowser(subdomain, d);
}
