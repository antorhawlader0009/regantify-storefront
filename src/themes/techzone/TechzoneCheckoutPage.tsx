'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoreSocialLinks } from '@/lib/socialLinksApi';
import { StoreHeader } from '../storepal/components/StoreHeader';
import { StoreFooter } from '../storepal/components/StoreFooter';
import { CheckoutDialogBody, type Lang } from '../storepal/components/CheckoutDialog';
import { getStoreNavData, type StoreNavData } from '../storepal/lib/storeNavApi';
import { useStoreDisplayName } from '../storepal/lib/useStoreDisplayName';
import { useStorePalDesign } from '../storepal/lib/designSettings';
import { useStoreText } from '../storepal/lib/storeText';
import { TechzonePageHeader } from './TechzoneBreadcrumb';

/**
 * Techzone's checkout page. The template has no checkout (its Checkout button is a demo), so this is drawn in the template's
 * page style (the plain page head, white bordered boxes) around StorePal's own checkout form (useCheckout: address with
 * district / thana / area, delivery zone and charge, express, pickup, delivery day and slot, coupon, gift card, reward
 * points, gift option, every payment method, COD advance, note), so every checkout rule stays the same. A page, never a
 * dialog: CheckoutDialog sends Techzone's "Buy Now" and "Checkout" here.
 */
export function TechzoneCheckoutPage({ subdomain }: { subdomain: string }) {
  const t = useStoreText();
  const router = useRouter();
  const design = useStorePalDesign();
  const storeName = useStoreDisplayName(subdomain);
  const [nav, setNav] = useState<StoreNavData>({ categories: [], categoryDetails: [] });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<Awaited<ReturnType<typeof getStoreSocialLinks>>>({});
  // The form's own words follow the store's language; the shopper can switch here like in StorePal's dialog.
  const [lang, setLang] = useState<Lang>(design.storeLanguage === 'en' ? 'en' : 'bn');

  useEffect(() => {
    getStoreNavData(subdomain).then(setNav);
    getStoreSocialLinks(subdomain).then((b) => {
      setLogoUrl(b.logoUrl ?? null);
      setSocialLinks(b);
    });
  }, [subdomain]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <StoreHeader
        subdomain={subdomain}
        storeName={storeName}
        categories={nav.categories}
        categoryDetails={nav.categoryDetails}
        logoUrl={logoUrl}
        socialLinks={socialLinks}
      />
      <TechzonePageHeader subdomain={subdomain} homeLabel={t('Home')} crumbs={[{ label: t('Cart'), href: `/store/${subdomain}/cart` }, { label: t('Checkout') }]} title={t('Checkout')}>
        <div role="group" aria-label="Language" className="flex overflow-hidden rounded-lg border border-[var(--tz-line)] text-[13px] font-semibold">
          {(['en', 'bn'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`px-3.5 py-1.5 transition-colors ${lang === l ? "bg-[var(--tz-brand)] text-white" : "hover:bg-[var(--tz-well)]"}`}
            >
              {l === 'en' ? 'English' : 'বাংলা'}
            </button>
          ))}
        </div>
      </TechzonePageHeader>
      <main className="tz-wrap w-full flex-1 py-8 sm:py-10">
        <div lang={lang} className="tz-checkout">
          <CheckoutDialogBody subdomain={subdomain} lang={lang} onClose={() => router.push(`/store/${subdomain}`)} />
        </div>
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} logoUrl={logoUrl} socialLinks={socialLinks} />
    </div>
  );
}
