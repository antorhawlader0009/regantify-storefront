'use client';

import { useEffect, useState, type ComponentProps } from 'react';
import { StorePalProductPanel as ProductPurchasePanel } from './StorePalProductPanel';
import { useCartDrawer } from '../lib/cartDrawer';
import { useCheckoutDialog } from '../lib/checkoutDialog';
import { lowStockLabel, stockMessages, useLowStock, useStorePalDesign, useStorePalLmsForms } from '../lib/designSettings';
import { trackMetaViewContent } from '@/lib/metaPixelEvents';
import { trackViewItem } from '@/lib/ecommerceEvents';
import { sendStoreEvent } from '@/lib/storeEvents';
import { isOutOfStock } from '@/lib/productDisplay';
import { ProductPolicyLines } from './ProductPolicyLines';
import { ProductTrustRow } from './TrustStrip';
import { BundleIncludes } from './BundleIncludes';
import { ShareButton } from './ShareButton';
import { DeliveryCheck } from './DeliveryCheck';
import { SoldRecentLine } from './SoldRecentLine';
import { ComingSoonNotify } from './ComingSoonNotify';
import type { ResolvedPolicy } from '../lib/policy';
import { CallMeBackLink, LeadFormButton, PriceOnRequest, StoreLeadFormDialog, type StoreFormType } from './StoreLeadForms';

type PanelProps = Omit<ComponentProps<typeof ProductPurchasePanel>, 'display' | 'leadSlots' | 'onAddedToCart'> & {
  /** Warranty and return lines under the Buy button (see lib/policy.ts). */
  policy?: ResolvedPolicy | null;
};

/**
 * Medium's shared ProductPurchasePanel plus Store > Design > Product
 * Display Options. A client wrapper because StorePal's ProductView is a
 * server component and can't read the design context itself. Also where
 * the product page's Meta pixel ViewContent fires, and where the LMS store
 * forms plug in, chosen by the product's own state:
 * - price on request (Product.quoteOnly) -> "Price on request" + "Request a price";
 * - sold out, not pre-order, no backorder -> "Notify me when it's back" instead of Buy;
 * - every product -> "Ask us to call you back" under Buy.
 */
export function StorePalPurchasePanel({ policy, ...props }: PanelProps) {
  const design = useStorePalDesign();
  const openCartDrawer = useCartDrawer((s) => s.openDrawer);
  const openCheckout = useCheckoutDialog((s) => s.openDialog);
  // The store's LMS forms (LMS-plan.md Step 9), from the StorePal layout's store info.
  const lmsForms = useStorePalLmsForms();
  const lowStock = useLowStock();
  const { product } = props;
  const [form, setForm] = useState<StoreFormType | null>(null);

  useEffect(() => {
    trackMetaViewContent(product);
    trackViewItem(product);
    sendStoreEvent(props.subdomain, 'PRODUCT_VIEW', product.id);
    // Once per product, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // Price on request needs no store switch: it's the vendor's choice per product.
  const quoteOnly = !!product.quoteOnly && !!lmsForms;
  const notifyMe = !quoteOnly && !!lmsForms?.notifyMe && !props.backorder && isOutOfStock(product);
  // Sold out on a store without the LMS "notify me" form (TellMe idea 136): the plain phone-number waitlist, on every plan.
  const restockNotify = !quoteOnly && !lmsForms?.notifyMe && !props.backorder && !product.comingSoon && isOutOfStock(product);
  const callMeBack = !!lmsForms?.callMeBack;
  // Coming soon (TellMe idea 104): no price, no Buy; a "Notify me" form instead.
  const comingSoon = !!product.comingSoon;

  const policyLines = policy && !quoteOnly ? <ProductPolicyLines policy={policy} /> : null;
  const bundleInfo = product.bundle && !quoteOnly ? <BundleIncludes product={product} /> : null;
  const leadSlots =
    lmsForms || policyLines || bundleInfo || (design.socialProofDays ?? 0) > 0 || !quoteOnly || comingSoon
      ? {
          price: comingSoon ? <span /> : quoteOnly ? <PriceOnRequest /> : undefined,
          purchase: comingSoon ? (
            <ComingSoonNotify subdomain={props.subdomain} slug={product.slug} until={product.comingSoonUntil} />
          ) : quoteOnly ? (
            <LeadFormButton type="price-request" onOpen={() => setForm('price-request')} />
          ) : notifyMe ? (
            <LeadFormButton type="notify-me" onOpen={() => setForm('notify-me')} />
          ) : restockNotify ? (
            <ComingSoonNotify subdomain={props.subdomain} slug={product.slug} restock />
          ) : undefined,
          after: (
            <>
              {!quoteOnly && !comingSoon && <ProductTrustRow subdomain={props.subdomain} preOrder={!!product.isPreOrder} />}
              {!quoteOnly && <DeliveryCheck subdomain={props.subdomain} />}
              <SoldRecentLine product={product} />
              {bundleInfo}
              {policyLines}

              {callMeBack ? <CallMeBackLink onOpen={() => setForm('call-back')} /> : null}
            </>
          ),
        }
      : undefined;

  // "Only 3 left" (Store > Stock Settings); never for pre-order products.
  const messages = stockMessages(design);
  const lowText = (stock: number | undefined) => (product.isPreOrder ? null : lowStockLabel(lowStock, design.storeLanguage, stock));
  const display = {
    imageShape: design.productImageShape,
    galleryStyle: design.galleryStyle,
    ...messages,
    inStock: (stock: number | undefined) =>
      lowText(stock) ?? messages.inStock(lowStock?.hideCount ? undefined : stock),
    isLowStock: (stock: number | undefined) => lowText(stock) !== null,
    language: design.storeLanguage,
  };

  return (
    <>
      <ProductPurchasePanel
        {...props}
        display={display}
        titleExtra={<ShareButton name={product.name} price={Number(product.discountPrice ?? product.price)} />}
        leadSlots={leadSlots}
        // A sold-out size/colour gets its own form, unless the LMS notify form, backorders or coming-soon take over.
        variantRestock={!quoteOnly && !lmsForms?.notifyMe && !props.backorder && !comingSoon}
        onAddedToCart={openCartDrawer}
        onBuyNow={openCheckout}
      />
      {form && (
        <StoreLeadFormDialog type={form} subdomain={props.subdomain} productId={product.id} productName={product.name} onClose={() => setForm(null)} />
      )}
    </>
  );
}
