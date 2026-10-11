'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import {
  createMyAddress,
  deleteMyAddress,
  listMyAddresses,
  updateMyAddressById,
  type SavedAddress,
  type SavedAddressInput,
} from '@/lib/customerAuthApi';
import { suggestZone } from '@/lib/deliveryZone';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import { AccountLayout } from '../../components/AccountLayout';
import { useStoreDisplayName } from '../../lib/useStoreDisplayName';
import { BdAddressPicker } from '@/components/BdAddressPicker';

const ZONE_LABEL: Record<SavedAddress['deliveryZone'], string> = {
  DHAKA: 'Inside Dhaka',
  AROUND_DHAKA: 'Around Dhaka',
  OUTSIDE_DHAKA: 'Outside Dhaka',
};

const inputClass = 'w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-canvas text-[13.5px] outline-none focus:border-ink transition-colors';
const labelClass = 'block text-[13px] font-medium text-ink mb-1.5';

interface Draft {
  label: string;
  recipientName: string;
  phone: string;
  district: string;
  city: string;
  address: string;
  deliveryZone: SavedAddress['deliveryZone'];
  isDefault: boolean;
}

const BLANK: Draft = { label: '', recipientName: '', phone: '', district: '', city: '', address: '', deliveryZone: 'DHAKA', isDefault: false };

/**
 * Account > My Addresses (TellMe idea 53): up to 5 saved delivery addresses (Home, Office, Mother's place), one of them the
 * default. Checkout shows them as one-tap buttons. A placed order keeps its own copy of the address, so changing or deleting
 * one here never changes an old order. (The page keeps the old Change Address route, /account/address.)
 */
export function ChangeAddressView({ subdomain }: { subdomain: string }) {
  const storeName = useStoreDisplayName(subdomain);
  const hydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const accessToken = useCustomerAuthStore((s) => s.accessToken);

  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null);
  const [max, setMax] = useState(5);
  // null = the form is closed; 'new' = adding; an id = editing that address.
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    listMyAddresses(accessToken)
      .then((r) => {
        if (cancelled) return;
        setAddresses(r.addresses);
        setMax(r.max);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Could not load your addresses.'));
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const apply = (r: { addresses: SavedAddress[]; max: number }) => {
    setAddresses(r.addresses);
    setMax(r.max);
  };

  const openNew = () => {
    setDraft({ ...BLANK, recipientName: customer?.fullName ?? '', phone: customer?.phone ?? '' });
    setEditing('new');
    setError(null);
  };

  const openEdit = (a: SavedAddress) => {
    setDraft({
      label: a.label,
      recipientName: a.recipientName,
      phone: a.phone,
      district: a.district ?? '',
      city: a.city ?? '',
      address: a.address,
      deliveryZone: a.deliveryZone,
      isDefault: a.isDefault,
    });
    setEditing(a.id);
    setError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !editing) return;
    setError(null);
    if (!draft.label.trim()) return setError('Give this address a name, like Home or Office.');
    if (draft.recipientName.trim().length < 2) return setError('Enter the receiver’s name.');
    if (!/^(\+?880|0)1[3-9]\d{8}$/.test(draft.phone.trim())) return setError('Enter a valid 11-digit phone number.');
    if (draft.address.trim().length < 3) return setError('Enter the full address.');
    const body: SavedAddressInput = {
      label: draft.label.trim(),
      recipientName: draft.recipientName.trim(),
      phone: draft.phone.trim(),
      district: draft.district.trim(),
      city: draft.city.trim(),
      address: draft.address.trim(),
      deliveryZone: draft.deliveryZone,
      isDefault: draft.isDefault,
    };
    setSaving(true);
    try {
      apply(editing === 'new' ? await createMyAddress(accessToken, body) : await updateMyAddressById(accessToken, editing, body));
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the address.');
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (a: SavedAddress) => {
    if (!accessToken) return;
    try {
      apply(await updateMyAddressById(accessToken, a.id, { isDefault: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the default address.');
    }
  };

  const remove = async (a: SavedAddress) => {
    if (!accessToken || !window.confirm(`Delete "${a.label}"?`)) return;
    try {
      apply(await deleteMyAddress(accessToken, a.id));
      if (editing === a.id) setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the address.');
    }
  };

  if (hydrated && !customer) {
    return (
      <AccountLayout subdomain={subdomain} storeName={storeName}>
        <div className="bg-surface border border-line rounded-lg p-6 text-center">
          <MapPin size={26} className="mx-auto text-muted mb-3" />
          <p className="text-[14px] text-ink font-semibold mb-1">Log in to manage your addresses</p>
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
      <h1 className="text-[22px] font-bold text-ink mb-1">My Addresses</h1>
      <p className="text-[13px] text-muted mb-5">
        Save up to {max} addresses. At checkout, tap one to fill in the address and the delivery charge.
      </p>

      {error && <p className="text-[12.5px] text-accent mb-3">{error}</p>}

      <div className="grid gap-3 max-w-2xl">
        {(addresses ?? []).map((a) => (
          <div key={a.id} className="bg-surface border border-line rounded-lg p-4">
            <div className="flex items-center gap-2">
              <p className="m-0 text-[14px] font-bold text-ink">{a.label}</p>
              {a.isDefault && <span className="rounded bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">Default</span>}
              <span className="ml-auto text-[12px] text-muted">{ZONE_LABEL[a.deliveryZone]}</span>
            </div>
            <p className="m-0 mt-1.5 text-[13px] text-ink">
              {a.recipientName} · {a.phone}
            </p>
            <p className="m-0 mt-0.5 text-[13px] text-muted">
              {[a.address, a.city, a.district].filter(Boolean).join(', ')}
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-[13px] font-semibold">
              <button type="button" onClick={() => openEdit(a)} className="text-ink underline underline-offset-2 hover:text-accent">
                Edit
              </button>
              {!a.isDefault && (
                <button type="button" onClick={() => void makeDefault(a)} className="text-ink underline underline-offset-2 hover:text-accent">
                  Make default
                </button>
              )}
              <button type="button" onClick={() => void remove(a)} className="text-accent underline underline-offset-2">
                Delete
              </button>
            </div>
          </div>
        ))}
        {addresses && addresses.length === 0 && editing === null && (
          <p className="text-[13px] text-muted">You have no saved address yet.</p>
        )}
      </div>

      {editing === null && addresses && addresses.length < max && (
        <button
          type="button"
          onClick={openNew}
          className="mt-4 px-5 py-2.5 rounded-md bg-ink hover:bg-ink/90 text-white text-[13.5px] font-bold transition-colors"
        >
          Add an address
        </button>
      )}

      {editing !== null && (
        <div className="mt-4 bg-surface border border-line rounded-lg p-5 sm:p-6 max-w-lg">
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className={labelClass}>Name this address</label>
              <input
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value.slice(0, 30) })}
                maxLength={30}
                placeholder="Home, Office, Mother's place"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Receiver&apos;s name</label>
              <input value={draft.recipientName} onChange={(e) => setDraft({ ...draft, recipientName: e.target.value.slice(0, 100) })} maxLength={100} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value.slice(0, 20) })} placeholder="01XXXXXXXXX" maxLength={20} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Full address</label>
              <textarea
                value={draft.address}
                onChange={(e) => setDraft({ ...draft, address: e.target.value.slice(0, 300) })}
                rows={3}
                maxLength={300}
                className={`${inputClass} resize-y font-[inherit]`}
              />
            </div>
            {/* District, then thana / upazila: picked from the list so the saved address is spelled one way. */}
            <BdAddressPicker
              district={draft.district}
              thana={draft.city}
              onDistrict={(value) => {
                const district = value.slice(0, 100);
                setDraft((d) => ({ ...d, district, deliveryZone: suggestZone(district, d.city) ?? d.deliveryZone }));
              }}
              onThana={(value) => {
                const city = value.slice(0, 100);
                setDraft((d) => ({ ...d, city, deliveryZone: suggestZone(d.district, city) ?? d.deliveryZone }));
              }}
              lang="en"
              labels={{
                district: 'District',
                thana: 'City / Thana / Upazila',
                districtPlaceholder: 'Select district',
                thanaPlaceholder: 'Select thana / upazila',
                thanaNeedsDistrict: 'Choose a district first',
                other: 'Other (type it)',
                typeDistrict: 'Type your district',
                typeThana: 'Type your city or thana',
              }}
              labelClassName={labelClass}
              controlClassName={inputClass}
            />
            <div>
              <label className={labelClass}>Delivery area</label>
              <select
                value={draft.deliveryZone}
                onChange={(e) => setDraft({ ...draft, deliveryZone: e.target.value as Draft['deliveryZone'] })}
                className={inputClass}
              >
                <option value="DHAKA">{ZONE_LABEL.DHAKA}</option>
                <option value="AROUND_DHAKA">{ZONE_LABEL.AROUND_DHAKA}</option>
                <option value="OUTSIDE_DHAKA">{ZONE_LABEL.OUTSIDE_DHAKA}</option>
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink">
              <input
                type="checkbox"
                checked={draft.isDefault}
                disabled={editing !== 'new' && !!addresses?.find((a) => a.id === editing)?.isDefault}
                onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })}
                className="h-4 w-4"
              />
              Use as my default address
            </label>

            {error && <p className="text-[12.5px] text-accent">{error}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-md bg-ink hover:bg-ink/90 text-white text-[13.5px] font-bold disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving…' : 'Save address'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={saving}
                className="px-6 py-2.5 rounded-md border border-line-strong bg-surface text-ink text-[13.5px] font-bold disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </AccountLayout>
  );
}
