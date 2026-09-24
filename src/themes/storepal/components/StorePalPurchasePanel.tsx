'use client';

import { useEffect, type ComponentProps } from 'react';
import { ProductPurchasePanel } from '../../medium/components/ProductPurchasePanel';
import { stockMessages, useStorePalDesign } from '../lib/designSettings';
import { trackMetaViewContent } from '@/lib/metaPixelEvents';

/**
 * Medium's shared ProductPurchasePanel plus Store > Design > Product
 * Display Options. A client wrapper because StorePal's ProductView is a
 * server component and can't read the design context itself. Also where
 * the product page's Meta pixel ViewContent fires.
 */
export function StorePalPurchasePanel(props: Omit<ComponentProps<typeof ProductPurchasePanel>, 'display'>) {
  const design = useStorePalDesign();
  const { product } = props;

  useEffect(() => {
    trackMetaViewContent(product);
    // Once per product, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  return (
    <ProductPurchasePanel
      {...props}
      display={{ imageShape: design.productImageShape, galleryStyle: design.galleryStyle, ...stockMessages(design) }}
    />
  );
}
