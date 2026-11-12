'use client';

import { useEffect, useState } from 'react';
import { useCheckoutDialog } from '../lib/checkoutDialog';
import { useStoreDisplayName } from '../lib/useStoreDisplayName';
import { getStoreNavData, type StoreNavData } from '../lib/storeNavApi';
import { getStoreSocialLinks } from '@/lib/socialLinksApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { useStoreSkin } from '../lib/designSettings';
import { PlaymateCheckoutPage } from '../../playmate/PlaymateCheckoutPage';
import { SolevoCheckoutPage } from '../../solevo/SolevoCheckoutPage';
import { ChronicsCheckoutPage } from '../../chronics/ChronicsCheckoutPage';
import { MahabeshCheckoutPage } from '../../mahabesh/MahabeshCheckoutPage';
import { ChicwoveCheckoutPage } from '../../chicwove/ChicwoveCheckoutPage';

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
function StorePalCheckoutView({ subdomain }: { subdomain: string }) {
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

/** PlayMate's checkout is a page of its own (PlaymateCheckoutPage); StorePal's opens the checkout dialog here. */
export function CheckoutView({ subdomain }: { subdomain: string }) {
  const skin = useStoreSkin();
  if (skin === 'mahabesh') return <MahabeshCheckoutPage subdomain={subdomain} />;
  if (skin === 'chronics') return <ChronicsCheckoutPage subdomain={subdomain} />;
  if (skin === 'chicwove') return <ChicwoveCheckoutPage subdomain={subdomain} />;
  if (skin === 'solevo') return <SolevoCheckoutPage subdomain={subdomain} />;
  return skin === 'playmate' ? <PlaymateCheckoutPage subdomain={subdomain} /> : <StorePalCheckoutView subdomain={subdomain} />;
}
