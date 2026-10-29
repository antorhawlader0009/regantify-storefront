'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, Check } from 'lucide-react';
import { getMyProfile, updateMyProfile } from '@/lib/customerAuthApi';
import { getStoreDeliveryCharges } from '@/lib/checkoutApi';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import { AddPhoneCard } from '../../components/AddPhoneCard';
import { AccountLayout } from '../../components/AccountLayout';
import { useStoreDisplayName } from '../../lib/useStoreDisplayName';
import { useStoreText } from '../../lib/storeText';
import { useStorePalDesign } from '../../lib/designSettings';

// Frozen fallback until the vendor's real Settings > Courier
// Integration > Delivery Charge values load - same reasoning/values as
// lib/useCheckout.ts's own DELIVERY_CHARGE fallback.
const FALLBACK_DELIVERY_CHARGE: Record<'DHAKA' | 'OUTSIDE_DHAKA', number> = {
  DHAKA: 60,
  OUTSIDE_DHAKA: 120,
};

/** Account > Edit Profile - same sidebar layout as the other account pages. */
export function ProfileView({ subdomain }: { subdomain: string }) {
  const t = useStoreText();
  const storeName = useStoreDisplayName(subdomain);
  const hydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const accessToken = useCustomerAuthStore((s) => s.accessToken);
  const updateCustomer = useCustomerAuthStore((s) => s.updateCustomer);
  const bn = useStorePalDesign().storeLanguage === 'bn';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState<'DHAKA' | 'OUTSIDE_DHAKA' | 'AROUND_DHAKA'>('DHAKA');
  // Store > Delivery Charge > Around Dhaka: the third area, offered while the store has it on.
  const [aroundCharge, setAroundCharge] = useState<number | null>(null);

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
      setAroundCharge(charges.aroundDhaka?.charge ?? null);
    });
  }, [subdomain]);

  useEffect(() => {
    if (!hydrated || !accessToken) return;
    getMyProfile(accessToken)
      .then((profile) => {
        setFullName(profile.fullName);
        setEmail(profile.email ?? '');
        setAddress(profile.address ?? '');
        // The saved area may be 'AROUND_DHAKA' (see Customer.deliveryZone), which the shared type leaves out.
        setZone((profile.deliveryZone as 'DHAKA' | 'OUTSIDE_DHAKA' | 'AROUND_DHAKA' | null) ?? 'DHAKA');
        setLoaded(true);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : t('Could not load your profile.')));
  }, [hydrated, accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaved(false);
    if (!fullName.trim()) {
      setSaveError(t('Enter your full name.'));
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
      setSaveError(err instanceof Error ? err.message : t('Could not save your profile.'));
    } finally {
      setSaving(false);
    }
  };

  if (hydrated && !customer) {
    return (
      <AccountLayout subdomain={subdomain} storeName={storeName}>
        <div className="bg-surface border border-line rounded-lg p-6 text-center">
          <User size={26} className="mx-auto text-muted mb-3" />
          <p className="text-[14px] text-ink font-semibold mb-1">{t('Log in to edit your profile')}</p>
          <Link
            href={`/store/${subdomain}/account/login`}
            className="inline-block mt-3 px-5 py-2.5 rounded-md bg-ink hover:bg-ink/90 text-white text-[13px] font-bold transition-colors"
          >
            {t('Log in')}
          </Link>
        </div>
      </AccountLayout>
    );
  }

  const zones = aroundCharge !== null ? (['DHAKA', 'AROUND_DHAKA', 'OUTSIDE_DHAKA'] as const) : (['DHAKA', 'OUTSIDE_DHAKA'] as const);
  const zoneLabel = { DHAKA: t('Inside Dhaka'), AROUND_DHAKA: t('Around Dhaka'), OUTSIDE_DHAKA: t('Outside Dhaka') };
  const zoneCharge = {
    DHAKA: deliveryCharge.DHAKA,
    AROUND_DHAKA: aroundCharge ?? deliveryCharge.OUTSIDE_DHAKA,
    OUTSIDE_DHAKA: deliveryCharge.OUTSIDE_DHAKA,
  };
  const initial = (fullName || customer?.fullName || '').trim()[0]?.toUpperCase();
  const signInWay = customer?.phone || (customer?.email ? `${customer.email}` : t('Signed in with Google'));
  // English digits in every language (the owner's rule), Bangla month names on a Bangla store.
  const since = customer?.createdAt
    ? new Date(customer.createdAt).toLocaleDateString(bn ? 'bn-BD-u-nu-latn' : 'en-GB', { month: 'long', year: 'numeric' })
    : null;
  const field =
    'w-full rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_18%,transparent)]';
  const label = 'mb-1.5 block text-[13px] font-medium text-ink';

  return (
    <AccountLayout subdomain={subdomain} storeName={storeName}>
      {/* Laid out by the dialog's own width (a container), so it fills the space beside the menu at any screen size. */}
      <div className="@container">
        <h2 className="sr-only">{t('Edit Profile')}</h2>

        {/* Who is signed in: the one bold part of the page. */}
        <section className="relative mb-5 overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="absolute inset-x-0 top-0 h-16 bg-accent/10" aria-hidden />
          <div className="relative flex flex-col gap-4 px-5 pb-5 pt-6 @lg:flex-row @lg:items-end @lg:gap-5 @lg:px-6">
            <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border-4 border-surface bg-accent text-[30px] font-bold text-white shadow-[0_6px_18px_-6px_rgba(16,24,40,0.35)]">
              {initial || <User size={30} aria-hidden />}
            </span>
            <div className="min-w-0 flex-1 @lg:pb-1">
              <p className="m-0 truncate text-[21px] font-bold leading-tight text-ink">{fullName || customer?.fullName}</p>
              <p className="m-0 mt-1 truncate text-[13.5px] text-muted">{signInWay}</p>
            </div>
            {since && (
              <p className="m-0 shrink-0 text-[12.5px] text-muted @lg:pb-1.5">{t('Member since {date}').replace('{date}', since)}</p>
            )}
          </div>
        </section>

        {/* An account opened with Google has no phone: add one (and join the old phone account, if there is one). */}
        {customer && !customer.phone && (
          <div className="mb-5">
            <AddPhoneCard subdomain={subdomain} />
          </div>
        )}

        {loadError && <p className="mb-4 text-[13px] text-accent">{loadError}</p>}

        {!loadError && !loaded ? (
          <div className="rounded-2xl border border-line bg-surface py-10 text-center text-[13px] text-muted">{t('Loading your profile…')}</div>
        ) : loaded ? (
          <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="grid @2xl:grid-cols-2">
              <section aria-labelledby="profile-personal" className="min-w-0 space-y-4 p-5 @lg:p-6">
                <div>
                  <h3 id="profile-personal" className="m-0 text-[15px] font-semibold text-ink">{t('Personal details')}</h3>
                  <p className="m-0 mt-0.5 text-[12.5px] text-muted">{t('Used on your orders and receipts.')}</p>
                </div>
                <div>
                  <label htmlFor="profile-name" className={label}>{t('Full Name')}</label>
                  <input
                    id="profile-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value.slice(0, 100))}
                    maxLength={100}
                    autoComplete="name"
                    className={field}
                  />
                </div>
                <div>
                  <label htmlFor="profile-email" className={label}>{t('Email (optional)')}</label>
                  <input
                    id="profile-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.slice(0, 150))}
                    maxLength={150}
                    autoComplete="email"
                    className={field}
                  />
                </div>
                <div>
                  <label htmlFor="profile-phone" className={label}>{t('Phone')}</label>
                  <input
                    id="profile-phone"
                    value={customer?.phone ?? ''}
                    placeholder={t('Signed in with Google')}
                    disabled
                    className="w-full cursor-not-allowed rounded-lg border border-dashed border-line-strong bg-canvas px-3.5 py-2.5 text-[14px] text-muted"
                  />
                </div>
              </section>

              <section aria-labelledby="profile-delivery" className="min-w-0 space-y-4 border-t border-line p-5 @lg:p-6 @2xl:border-l @2xl:border-t-0">
                <div>
                  <h3 id="profile-delivery" className="m-0 text-[15px] font-semibold text-ink">{t('Delivery details')}</h3>
                  <p className="m-0 mt-0.5 text-[12.5px] text-muted">{t('Filled in for you at checkout.')}</p>
                </div>
                <div>
                  <label htmlFor="profile-address" className={label}>{t('Delivery Address (optional)')}</label>
                  <textarea
                    id="profile-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value.slice(0, 300))}
                    rows={3}
                    maxLength={300}
                    autoComplete="street-address"
                    className={`${field} resize-y font-[inherit]`}
                  />
                </div>
                <div role="radiogroup" aria-labelledby="profile-zone">
                  <p id="profile-zone" className={label}>{t('Delivery Area')}</p>
                  <div className="overflow-hidden rounded-lg border border-line-strong">
                    {zones.map((z, i) => {
                      const on = zone === z;
                      return (
                        <button
                          key={z}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setZone(z)}
                          className={`flex w-full items-center gap-3 px-3.5 py-3 text-left text-[13.5px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
                            i > 0 ? 'border-t border-line' : ''
                          } ${on ? 'bg-accent/10' : 'bg-surface hover:bg-canvas'}`}
                        >
                          <span
                            className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${on ? 'border-accent' : 'border-line-strong'}`}
                            aria-hidden
                          >
                            {on && <span className="h-2 w-2 rounded-full bg-accent" />}
                          </span>
                          <span className={`flex-1 ${on ? 'font-semibold text-ink' : 'text-ink'}`}>{zoneLabel[z]}</span>
                          <span className={`tabular-nums ${on ? 'font-semibold text-accent' : 'text-muted'}`}>৳{zoneCharge[z]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-line bg-canvas/60 px-5 py-4 @md:flex-row @md:items-center @md:justify-between @lg:px-6">
              <div className="min-h-[18px] text-[12.5px]" aria-live="polite">
                {saveError && <span className="text-accent">{saveError}</span>}
                {saved && !saveError && (
                  <span className="inline-flex items-center gap-1.5 font-medium text-success">
                    <Check size={14} />
                    {t('Profile saved.')}
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-ink px-7 py-2.5 text-[14px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {saving ? t('Saving…') : t('Save Profile')}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </AccountLayout>
  );
}
