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
import { TechzoneCheckoutPage } from '../../techzone/TechzoneCheckoutPage';
import { StrideCheckoutPage } from '../../stride/StrideCheckoutPage';
import { VaeloraCheckoutPage } from '../../vaelora/VaeloraCheckoutPage';
import { ChicwoveCheckoutPage } from '../../chicwove/ChicwoveCheckoutPage';
import { VivaCheckoutPage } from '../../viva/VivaCheckoutPage';
import { UrbanxCheckoutPage } from '../../urbanx/UrbanxCheckoutPage';
import { TechnovaCheckoutPage } from '../../technova/TechnovaCheckoutPage';
import { TastehouseCheckoutPage } from '../../tastehouse/TastehouseCheckoutPage';
import { SporteqCheckoutPage } from '../../sporteq/SporteqCheckoutPage';
import { ShopeaseCheckoutPage } from '../../shopease/ShopeaseCheckoutPage';
import { QuickbiteCheckoutPage } from '../../quickbite/QuickbiteCheckoutPage';
import { PetmartCheckoutPage } from '../../petmart/PetmartCheckoutPage';
import { PapernestCheckoutPage } from '../../papernest/PapernestCheckoutPage';
import { NovellaCheckoutPage } from '../../novella/NovellaCheckoutPage';
import { NovatrendCheckoutPage } from '../../novatrend/NovatrendCheckoutPage';
import { MinimogCheckoutPage } from '../../minimog/MinimogCheckoutPage';
import { MenauraCheckoutPage } from '../../menaura/MenauraCheckoutPage';
import { MallonCheckoutPage } from '../../mallon/MallonCheckoutPage';
import { GroceryantoCheckoutPage } from '../../groceryanto/GroceryantoCheckoutPage';
import { GreenmartCheckoutPage } from '../../greenmart/GreenmartCheckoutPage';
import { GloweriveCheckoutPage } from '../../glowerive/GloweriveCheckoutPage';
import { GadgetstoreCheckoutPage } from '../../gadgetstore/GadgetstoreCheckoutPage';
import { FurniluxCheckoutPage } from '../../furnilux/FurniluxCheckoutPage';
import { EstateproCheckoutPage } from '../../estatepro/EstateproCheckoutPage';
import { DrivecraftCheckoutPage } from '../../drivecraft/DrivecraftCheckoutPage';
import { BeloraCheckoutPage } from '../../belora/BeloraCheckoutPage';
import { ElevateCheckoutPage } from '../../elevate/ElevateCheckoutPage';

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
  if (skin === 'stride') return <StrideCheckoutPage subdomain={subdomain} />;
  if (skin === 'vaelora') return <VaeloraCheckoutPage subdomain={subdomain} />;
  if (skin === 'techzone') return <TechzoneCheckoutPage subdomain={subdomain} />;
  if (skin === 'mahabesh') return <MahabeshCheckoutPage subdomain={subdomain} />;
  if (skin === 'chronics') return <ChronicsCheckoutPage subdomain={subdomain} />;
  if (skin === 'chicwove') return <ChicwoveCheckoutPage subdomain={subdomain} />;
  if (skin === 'viva') return <VivaCheckoutPage subdomain={subdomain} />;
  if (skin === 'urbanx') return <UrbanxCheckoutPage subdomain={subdomain} />;
  if (skin === 'technova') return <TechnovaCheckoutPage subdomain={subdomain} />;
  if (skin === 'tastehouse') return <TastehouseCheckoutPage subdomain={subdomain} />;
  if (skin === 'sporteq') return <SporteqCheckoutPage subdomain={subdomain} />;
  if (skin === 'shopease') return <ShopeaseCheckoutPage subdomain={subdomain} />;
  if (skin === 'quickbite') return <QuickbiteCheckoutPage subdomain={subdomain} />;
  if (skin === 'petmart') return <PetmartCheckoutPage subdomain={subdomain} />;
  if (skin === 'papernest') return <PapernestCheckoutPage subdomain={subdomain} />;
  if (skin === 'novella') return <NovellaCheckoutPage subdomain={subdomain} />;
  if (skin === 'novatrend') return <NovatrendCheckoutPage subdomain={subdomain} />;
  if (skin === 'minimog') return <MinimogCheckoutPage subdomain={subdomain} />;
  if (skin === 'menaura') return <MenauraCheckoutPage subdomain={subdomain} />;
  if (skin === 'mallon') return <MallonCheckoutPage subdomain={subdomain} />;
  if (skin === 'groceryanto') return <GroceryantoCheckoutPage subdomain={subdomain} />;
  if (skin === 'greenmart') return <GreenmartCheckoutPage subdomain={subdomain} />;
  if (skin === 'glowerive') return <GloweriveCheckoutPage subdomain={subdomain} />;
  if (skin === 'gadgetstore') return <GadgetstoreCheckoutPage subdomain={subdomain} />;
  if (skin === 'furnilux') return <FurniluxCheckoutPage subdomain={subdomain} />;
  if (skin === 'estatepro') return <EstateproCheckoutPage subdomain={subdomain} />;
  if (skin === 'drivecraft') return <DrivecraftCheckoutPage subdomain={subdomain} />;
  if (skin === 'belora') return <BeloraCheckoutPage subdomain={subdomain} />;
  if (skin === 'elevate') return <ElevateCheckoutPage subdomain={subdomain} />;
  if (skin === 'solevo') return <SolevoCheckoutPage subdomain={subdomain} />;
  return skin === 'playmate' ? <PlaymateCheckoutPage subdomain={subdomain} /> : <StorePalCheckoutView subdomain={subdomain} />;
}
