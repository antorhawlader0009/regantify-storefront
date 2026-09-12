'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, LogOut, Check } from 'lucide-react';
import { getMyProfile, updateMyProfile } from '@/lib/customerAuthApi';
import {
  useCustomerAuthStore,
  useCustomerAuthHydrated,
  useCustomerLogout,
} from '@/providers/customer-auth-store-provider';

const DELIVERY_CHARGE: Record<'DHAKA' | 'OUTSIDE_DHAKA', number> = {
  DHAKA: 70,
  OUTSIDE_DHAKA: 130,
};

export function ProfileView({ subdomain }: { subdomain: string }) {
  const hydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const accessToken = useCustomerAuthStore((s) => s.accessToken);
  const updateCustomer = useCustomerAuthStore((s) => s.updateCustomer);
  const logout = useCustomerLogout();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState<'DHAKA' | 'OUTSIDE_DHAKA'>('DHAKA');

  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!hydrated || !accessToken) return;
    getMyProfile(accessToken)
      .then((profile) => {
        setFullName(profile.fullName);
        setEmail(profile.email ?? '');
        setAddress(profile.address ?? '');
        setZone(profile.deliveryZone ?? 'DHAKA');
        setLoaded(true);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Could not load your profile.'));
  }, [hydrated, accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaved(false);
    if (!fullName.trim()) {
      setSaveError('Enter your full name.');
      return;
    }
    if (!accessToken) return;

    setSaving(true);
    try {
      const updated = await updateMyProfile(accessToken, {
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        deliveryZone: zone,
      });
      updateCustomer(updated);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  if (hydrated && !customer) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-5">
        <div className="max-w-sm w-full text-center">
          <User size={26} strokeWidth={1.5} className="mx-auto text-muted mb-4" />
          <p className="text-[15px] text-ink font-display italic mb-1">Log in to edit your profile</p>
          <p className="text-[12.5px] text-muted mb-6">Save your details once, and checkout gets faster every time after.</p>
          <Link
            href={`/store/${subdomain}/account/login`}
            className="inline-block px-6 py-2.5 bg-ink hover:bg-accent-dark text-white text-[12.5px] tracking-[0.04em] uppercase transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line">
        <div className="max-w-sm mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
          <Link href={`/store/${subdomain}`} className="inline-flex items-center gap-1.5 text-[13px] text-ink hover:text-accent transition-colors">
            <ArrowLeft size={14} strokeWidth={1.5} />
            Back to store
          </Link>
          {customer && (
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-ink transition-colors"
            >
              <LogOut size={13} strokeWidth={1.5} />
              Log out
            </button>
          )}
        </div>
      </header>

      <main className="max-w-sm mx-auto px-5 sm:px-8 py-14">
        <h1 className="font-display italic text-[24px] text-ink mb-1.5">Your profile</h1>
        <p className="text-[13px] text-muted mb-8">
          Save your details so checkout is already filled in next time you order.
        </p>

        {customer && (
          <div className="flex gap-4 mb-7 text-[12px] pb-4 border-b border-line">
            <Link
              href={`/store/${subdomain}/account/orders`}
              className="text-muted hover:text-ink transition-colors"
            >
              My Orders
            </Link>
            <span className="text-ink">Edit Profile</span>
          </div>
        )}

        {loadError && <div className="text-[13px] text-accent-dark mb-4">{loadError}</div>}

        {!loadError && !loaded ? (
          <div className="text-center text-[13px] text-muted py-6">Loading your profile…</div>
        ) : loaded ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] tracking-[0.06em] uppercase text-muted mb-2">Phone</label>
              <input
                value={customer?.phone ?? ''}
                disabled
                className="w-full px-0 py-2.5 bg-transparent border-b border-line text-[13.5px] text-muted cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-[0.06em] uppercase text-muted mb-2">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="w-full px-0 py-2.5 bg-transparent border-b border-line text-[13.5px] outline-none transition-colors focus:border-ink placeholder:text-muted"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-[0.06em] uppercase text-muted mb-2">Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-0 py-2.5 bg-transparent border-b border-line text-[13.5px] outline-none transition-colors focus:border-ink placeholder:text-muted"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-[0.06em] uppercase text-muted mb-2">Delivery address (optional)</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House, road, area, city"
                rows={3}
                className="w-full px-0 py-2.5 bg-transparent border-b border-line text-[13.5px] outline-none resize-y font-[inherit] transition-colors focus:border-ink placeholder:text-muted"
              />
            </div>

            <div>
              <p className="text-[11px] tracking-[0.06em] uppercase text-muted mb-2.5">Delivery Area</p>
              <div className="flex gap-2">
                {(['DHAKA', 'OUTSIDE_DHAKA'] as const).map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZone(z)}
                    className={`flex-1 py-2.5 text-[12px] border transition-colors ${
                      zone === z ? 'border-ink bg-ink text-white' : 'border-line text-ink'
                    }`}
                  >
                    {z === 'DHAKA' ? `Inside Dhaka — ৳${DELIVERY_CHARGE.DHAKA}` : `Outside Dhaka — ৳${DELIVERY_CHARGE.OUTSIDE_DHAKA}`}
                  </button>
                ))}
              </div>
            </div>

            {saveError && <p className="text-[12px] text-accent-dark">{saveError}</p>}
            {saved && (
              <p className="flex items-center gap-1.5 text-[12px] text-ink">
                <Check size={13} strokeWidth={1.5} />
                Profile saved.
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-ink hover:bg-accent-dark text-white text-[12.5px] tracking-[0.04em] uppercase disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        ) : null}
      </main>
    </div>
  );
}
