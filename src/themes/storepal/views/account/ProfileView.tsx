'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, Check } from 'lucide-react';
import { getMyProfile, updateMyProfile } from '@/lib/customerAuthApi';
import { getStoreDeliveryCharges } from '@/lib/checkoutApi';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import { AccountLayout } from '../../components/AccountLayout';
import { useStoreDisplayName } from '../../lib/useStoreDisplayName';

// Frozen fallback until the vendor's real Settings > Courier
// Integration > Delivery Charge values load — same reasoning/values as
// lib/useCheckout.ts's own DELIVERY_CHARGE fallback.
const FALLBACK_DELIVERY_CHARGE: Record<'DHAKA' | 'OUTSIDE_DHAKA', number> = {
  DHAKA: 70,
  OUTSIDE_DHAKA: 130,
};

/** Account > Edit Profile — same sidebar layout as the other account pages. */
export function ProfileView({ subdomain }: { subdomain: string }) {
  const storeName = useStoreDisplayName(subdomain);
  const hydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const accessToken = useCustomerAuthStore((s) => s.accessToken);
  const updateCustomer = useCustomerAuthStore((s) => s.updateCustomer);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState<'DHAKA' | 'OUTSIDE_DHAKA'>('DHAKA');

  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState(FALLBACK_DELIVERY_CHARGE);

  useEffect(() => {
    getStoreDeliveryCharges(subdomain).then((charges) => {
      if (!charges) return;
      setDeliveryCharge({
        DHAKA: Number(charges.insideDhakaCharge),
        OUTSIDE_DHAKA: Number(charges.outsideDhakaCharge),
      });
    });
  }, [subdomain]);

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
      <AccountLayout subdomain={subdomain} storeName={storeName}>
        <div className="bg-surface border border-line rounded-lg p-6 text-center">
          <User size={26} className="mx-auto text-muted mb-3" />
          <p className="text-[14px] text-ink font-semibold mb-1">Log in to edit your profile</p>
          <Link
            href={`/store/${subdomain}/account/login`}
            className="inline-block mt-3 px-5 py-2.5 rounded-md bg-ink hover:bg-ink/90 text-white text-[13px] font-bold transition-colors"
          >
            Log in
          </Link>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout subdomain={subdomain} storeName={storeName}>
      <h1 className="text-[22px] font-bold text-ink mb-5">Edit Profile</h1>

      <div className="bg-surface border border-line rounded-lg p-5 sm:p-6 max-w-lg">
        {loadError && <div className="text-[13px] text-accent mb-4">{loadError}</div>}

        {!loadError && !loaded ? (
          <div className="text-center text-[13px] text-muted py-6">Loading your profile…</div>
        ) : loaded ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-ink mb-1.5">Phone</label>
              <input
                value={customer?.phone ?? ''}
                disabled
                className="w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-canvas text-[13.5px] text-muted cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-ink mb-1.5">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value.slice(0, 100))}
                maxLength={100}
                className="w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-canvas text-[13.5px] outline-none focus:border-ink transition-colors"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-ink mb-1.5">Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.slice(0, 150))}
                maxLength={150}
                className="w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-canvas text-[13.5px] outline-none focus:border-ink transition-colors"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-ink mb-1.5">Delivery Address (optional)</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value.slice(0, 300))}
                rows={3}
                maxLength={300}
                className="w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-canvas text-[13.5px] outline-none resize-y font-[inherit] focus:border-ink transition-colors"
              />
            </div>

            <div>
              <p className="text-[13px] font-medium text-ink mb-2">Delivery Area</p>
              <div className="flex gap-2">
                {(['DHAKA', 'OUTSIDE_DHAKA'] as const).map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZone(z)}
                    className={`flex-1 py-2.5 rounded-md text-[12.5px] font-semibold border transition-colors ${
                      zone === z ? 'border-accent bg-accent text-white' : 'border-line-strong bg-canvas text-ink'
                    }`}
                  >
                    {z === 'DHAKA' ? `Inside Dhaka — ৳${deliveryCharge.DHAKA}` : `Outside Dhaka — ৳${deliveryCharge.OUTSIDE_DHAKA}`}
                  </button>
                ))}
              </div>
            </div>

            {saveError && <p className="text-[12.5px] text-accent">{saveError}</p>}
            {saved && (
              <p className="flex items-center gap-1.5 text-[12.5px] text-success font-medium">
                <Check size={13} />
                Profile saved.
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-md bg-ink hover:bg-ink/90 text-white text-[13.5px] font-bold disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        ) : null}
      </div>
    </AccountLayout>
  );
}
