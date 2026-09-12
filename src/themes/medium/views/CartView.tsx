import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { CartList } from '../components/CartList';

interface CartViewProps {
  subdomain: string;
  storeName: string;
  categories: string[];
}

export function CartView({ subdomain, storeName, categories }: CartViewProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={categories} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        <h1 className="text-[18px] font-bold text-ink mb-5">Your Cart</h1>
        <div className="bg-surface border border-line rounded-lg p-4 sm:p-6 shadow-card">
          <CartList subdomain={subdomain} storeName={storeName} />
        </div>
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
