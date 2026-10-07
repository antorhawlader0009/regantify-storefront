'use client';

import { useEffect, useState, type ComponentProps } from 'react';
import { StorePalProductPanel as ProductPurchasePanel } from './StorePalProductPanel';
import { useCartDrawer } from '../lib/cartDrawer';
import { useCheckoutDialog } from '../lib/checkoutDialog';
import { stockMessages, useStorePalDesign, useStorePalLmsForms } from '../lib/designSettings';
import { trackMetaViewContent } from '@/lib/metaPixelEvents';
import { trackViewItem } from '@/lib/ecommerceEvents';
import { sendStoreEvent } from '@/lib/storeEvents';
import { isOutOfStock } from '@/lib/productDisplay';
import { CallMeBackLink, LeadFormButton, PriceOnRequest, StoreLeadFormDialog, type StoreFormType } from './StoreLeadForms';

type PanelProps = Omit<ComponentProps<typeof ProductPurchasePanel>, 'display' | 'leadSlots' | 'onAddedToCart'>;

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
export function StorePalPurchasePanel(props: PanelProps) {
  const design = useStorePalDesign();
  const openCartDrawer = useCartDrawer((s) => s.openDrawer);
  const openCheckout = useCheckoutDialog((s) => s.openDialog);
  // The store's LMS forms (LMS-plan.md Step 9), from the StorePal layout's store info.
  const lmsForms = useStorePalLmsForms();
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
  const callMeBack = !!lmsForms?.callMeBack;

  const leadSlots = lmsForms
    ? {
        price: quoteOnly ? <PriceOnRequest /> : undefined,
        purchase: quoteOnly ? (
          <LeadFormButton type="price-request" onOpen={() => setForm('price-request')} />
        ) : notifyMe ? (
          <LeadFormButton type="notify-me" onOpen={() => setForm('notify-me')} />
        ) : undefined,
        after: callMeBack ? <CallMeBackLink onOpen={() => setForm('call-back')} /> : undefined,
      }
    : undefined;

  return (
    <>
      <ProductPurchasePanel
        {...props}
        display={{ imageShape: design.productImageShape, galleryStyle: design.galleryStyle, ...stockMessages(design) }}
        leadSlots={leadSlots}
        onAddedToCart={openCartDrawer}
        onBuyNow={openCheckout}
      />
      {form && (
        <StoreLeadFormDialog type={form} subdomain={props.subdomain} productId={product.id} productName={product.name} onClose={() => setForm(null)} />
      )}
    </>
  );
}
