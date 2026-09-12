'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { updateMyAddress } from '@/lib/customerAuthApi';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import { AccountLayout } from '../../components/AccountLayout';
import { useStoreDisplayName } from '../../lib/useStoreDisplayName';

/** Account > Change Address — matches the reference Street Address / City / District / ZIP Code form. */
export function ChangeAddressView({ subdomain }: { subdomain: string }) {
  const storeName = useStoreDisplayName(subdomain);
  const hydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const accessToken = useCustomerAuthStore((s) => s.accessToken);
  const updateCustomer = useCustomerAuthStore((s) => s.updateCustomer);

  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!streetAddress.trim()) {
      setError('Enter your street address.');
      return;
    }
    if (!accessToken) return;
    setSaving(true);
    try {
      const updated = await updateMyAddress(accessToken, {
        streetAddress: streetAddress.trim(),
        city: city.trim() || undefined,
        district: district.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
      });
      updateCustomer(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update your address.');
    } finally {
      setSaving(false);
    }
  };

  if (hydrated && !customer) {
    return (
      <AccountLayout subdomain={subdomain} storeName={storeName}>
        <div className="bg-surface border border-line rounded-lg p-6 text-center">
          <MapPin size={26} className="mx-auto text-muted mb-3" />
          <p className="text-[14px] text-ink font-semibold mb-1">Log in to update your address</p>
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
      <h1 className="text-[22px] font-bold text-ink mb-5">Change Address</h1>
      <div className="bg-surface border border-line rounded-lg p-5 sm:p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">Street Address</label>
            <input
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value.slice(0, 300))}
              maxLength={300}
              className="w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-canvas text-[13.5px] outline-none focus:border-ink transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value.slice(0, 100))}
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-canvas text-[13.5px] outline-none focus:border-ink transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">District</label>
            <input
              value={district}
              onChange={(e) => setDistrict(e.target.value.slice(0, 100))}
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-canvas text-[13.5px] outline-none focus:border-ink transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">ZIP Code</label>
            <input
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.slice(0, 20))}
              maxLength={20}
              className="w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-canvas text-[13.5px] outline-none focus:border-ink transition-colors"
            />
          </div>

          {error && <p className="text-[12.5px] text-accent">{error}</p>}
          {saved && <p className="text-[12.5px] text-success">Address updated successfully.</p>}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-md bg-ink hover:bg-ink/90 text-white text-[13.5px] font-bold disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving…' : 'Update Address'}
          </button>
        </form>
      </div>
    </AccountLayout>
  );
}
