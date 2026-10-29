// The central Regantify sign-in page's calls (server customer-auth/shopper-connect). This page never loads a store's own code, so the
// addresses a shopper saved at other stores are only ever shown here, never on a store's page.
function apiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

export interface OfferedAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  district: string | null;
  city: string | null;
  address: string;
  /** The store it was saved at. */
  savedAt: string;
}

export interface ConnectAnswer {
  connectToken: string;
  store: { name: string; subdomain: string };
  customer: { name: string; email: string | null; phone: string | null };
  addresses: OfferedAddress[];
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${apiOrigin()}/v1/shopper-connect${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
    throw new Error(message || 'Something went wrong. Please try again.');
  }
  return data as T;
}

export async function connectConfig(): Promise<{ enabled: boolean; google: boolean }> {
  const res = await fetch(`${apiOrigin()}/v1/shopper-connect/config`).catch(() => null);
  return res?.ok ? res.json() : { enabled: false, google: false };
}

export const connectApi = {
  target: (subdomain: string, returnTo: string) => post<{ store: { name: string; subdomain: string } }>('/target', { subdomain, returnTo }),
  // `link`: the account dialog's "Connect Google" ticket; Google is then attached to that shopper instead of signing in.
  googleStart: (subdomain: string, returnTo: string, link?: string) =>
    post<{ url: string }>('/google/start', link ? { subdomain, returnTo, link } : { subdomain, returnTo }),
  googleCallback: (code: string, state: string) => post<ConnectAnswer>('/google/callback', { code, state }),
  phoneSend: (subdomain: string, returnTo: string, phone: string) => post<{ sent: boolean }>('/phone/send', { subdomain, returnTo, phone }),
  phoneVerify: (subdomain: string, returnTo: string, phone: string, code: string) => post<ConnectAnswer>('/phone/verify', { subdomain, returnTo, phone, code }),
  finish: (connectToken: string, addressIds: string[]) => post<{ redirect: string; copied: number }>('/finish', { connectToken, addressIds }),
};
