'use client';

import { useEffect, useState } from 'react';
import { useCheckoutDialog } from '../lib/checkoutDialog';
import { useStoreDisplayName } from '../lib/useStoreDisplayName';
import { getStoreNavData, type StoreNavData } from '../lib/storeNavApi';
import { getStoreSocialLinks } from '@/lib/socialLinksApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';

/**
 * StorePal's checkout is a dialog (components/CheckoutDialog.tsx, mounted by
 * StoreHeader), not a page. This route only exists for saved links and page
 * reloads: it shows the store's header and footer and opens that same dialog;
 * closing it sends the shopper back to the store home.
 *
 * Client Component, so it has no server-fetched list data: the category nav and
 * logo/social links for the header and footer are fetched here, the same
 * prop-or-fetch pattern those components support for account/* pages.
 */
export function CheckoutView({ subdomain }: { subdomain: string }) {
  const openDialog = useCheckoutDialog((s) => s.openDialog);
  const storeName = useStoreDisplayName(subdomain);
  const [nav, setNav] = useState<StoreNavData>({ categories: [], categoryDetails: [] });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<Awaited<ReturnType<typeof getStoreSocialLinks>>>({});

  useEffect(() => {
    openDialog();
  }, [openDialog]);

  useEffect(() => {
    getStoreNavData(subdomain).then(setNav);
    getStoreSocialLinks(subdomain).then((b) => {
      setLogoUrl(b.logoUrl ?? null);
      setSocialLinks(b);
    });
  }, [subdomain]);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <StoreHeader
        subdomain={subdomain}
        storeName={storeName}
        categories={nav.categories}
        categoryDetails={nav.categoryDetails}
        logoUrl={logoUrl}
        socialLinks={socialLinks}
      />
      <StoreFooter subdomain={subdomain} storeName={storeName} logoUrl={logoUrl} socialLinks={socialLinks} />
    </div>
  );
}
