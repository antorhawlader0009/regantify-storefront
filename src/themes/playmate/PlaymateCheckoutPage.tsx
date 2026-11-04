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
import { PlaymateBreadcrumb } from './PlaymateBreadcrumb';

/**
 * PlayMate's checkout page. The template has no checkout (its cart button is a demo), so this is drawn in the template's
 * page style (breadcrumb, big title, grey boxes) around StorePal's own checkout form (useCheckout: address with
 * district / thana / area, delivery zone and charge, express, pickup, delivery day and slot, coupon, gift card, reward
 * points, gift option, every payment method, COD advance, note), so every checkout rule stays the same. A page, never a
 * dialog: CheckoutDialog sends PlayMate's "Buy Now" and "Checkout" here.
 */
export function PlaymateCheckoutPage({ subdomain }: { subdomain: string }) {
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
      <main className="pm-wrap w-full flex-1 py-6 sm:py-8">
        <PlaymateBreadcrumb subdomain={subdomain} homeLabel={t('Home')} items={[{ label: t('Cart'), href: `/store/${subdomain}/cart` }, { label: t('Checkout') }]} />
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t('Checkout')}</h1>
          <div role="group" aria-label="Language" className="flex overflow-hidden rounded-full border border-line-strong text-[12px] font-semibold">
            {(['en', 'bn'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`px-3 py-1.5 transition-colors ${lang === l ? 'bg-accent text-white' : 'text-muted hover:text-ink'}`}
              >
                {l === 'en' ? 'English' : 'বাংলা'}
              </button>
            ))}
          </div>
        </div>
        <div lang={lang} className="pm-checkout mt-6">
          <CheckoutDialogBody subdomain={subdomain} lang={lang} onClose={() => router.push(`/store/${subdomain}`)} />
        </div>
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} logoUrl={logoUrl} socialLinks={socialLinks} />
    </div>
  );
}
