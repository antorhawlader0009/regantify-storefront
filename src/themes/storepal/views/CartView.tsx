import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
// Theme-agnostic (see ProductView.tsx's own comment on why) — reused
// as-is from Medium rather than a near-duplicate rebuild.
import { CartList } from '../../medium/components/CartList';
import { CartViewTracker } from '../components/CartViewTracker';
import { CartOffers } from '../components/CartOffers';
import { useStoreText } from '../lib/storeText';

interface CartViewProps {
  subdomain: string;
  storeName: string;
  categories: string[];
}

export function CartView({ subdomain, storeName, categories }: CartViewProps) {
  const t = useStoreText();
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={categories} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <h1 className="text-[24px] font-bold text-ink mb-5">{t('Cart')}</h1>
        <div className="bg-surface border border-line rounded-lg p-4 sm:p-6">
          <CartList subdomain={subdomain} storeName={storeName} />
        </div>
        <CartOffers subdomain={subdomain} />
        <CartViewTracker subdomain={subdomain} />
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
