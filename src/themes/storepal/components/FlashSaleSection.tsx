import { Zap } from 'lucide-react';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { ProductCard } from './ProductCard';
import { useStoreText } from '../lib/storeText';

const MAX_SALE_PRODUCTS = 8;

/**
 * Marketing > Flash Sale on the StorePal homepage. Products already arrive with
 * the sale price and `flashSaleEndsAt` (set only while a sale really lowers the
 * price), so this just gathers them under one heading, soonest-ending first; each
 * card keeps its own countdown. Renders nothing when no sale is running.
 */
export function FlashSaleSection({
  subdomain,
  storeName,
  products,
}: {
  subdomain: string;
  storeName: string;
  products: StorefrontProduct[];
}) {
  const t = useStoreText();
  const now = Date.now();
  const onSale = products
    .filter((p) => p.flashSaleEndsAt && new Date(p.flashSaleEndsAt).getTime() > now)
    .sort((a, b) => new Date(a.flashSaleEndsAt!).getTime() - new Date(b.flashSaleEndsAt!).getTime())
    .slice(0, MAX_SALE_PRODUCTS);
  if (onSale.length === 0) return null;
  return (
    <section aria-label="Flash sale">
      <h2 className="text-[18px] font-bold text-ink mb-4 flex items-center justify-center gap-2">
        <Zap size={18} className="text-orange-500" aria-hidden />
        {t('Flash Sale')}
        <Zap size={18} className="text-orange-500" aria-hidden />
      </h2>
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
        {onSale.map((product) => (
          <ProductCard key={product.id} product={product} subdomain={subdomain} storeName={storeName} />
        ))}
      </div>
    </section>
  );
}
