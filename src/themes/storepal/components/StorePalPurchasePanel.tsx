'use client';

import type { ComponentProps } from 'react';
import { ProductPurchasePanel } from '../../medium/components/ProductPurchasePanel';
import { stockMessages, useStorePalDesign } from '../lib/designSettings';

/**
 * Medium's shared ProductPurchasePanel plus Store > Design > Product
 * Display Options. A client wrapper because StorePal's ProductView is a
 * server component and can't read the design context itself.
 */
export function StorePalPurchasePanel(props: Omit<ComponentProps<typeof ProductPurchasePanel>, 'display'>) {
  const design = useStorePalDesign();
  return (
    <ProductPurchasePanel
      {...props}
      display={{ imageShape: design.productImageShape, galleryStyle: design.galleryStyle, ...stockMessages(design) }}
    />
  );
}
