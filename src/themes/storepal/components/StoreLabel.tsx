'use client';

import { useStoreText } from '../lib/storeText';

/**
 * `useStoreText()` for server components (ProductView, CartView): a hook can't run there, so they
 * render the label through this tiny client component instead.
 */
export function StoreLabel({ text }: { text: string }) {
  const t = useStoreText();
  return <>{t(text)}</>;
}
