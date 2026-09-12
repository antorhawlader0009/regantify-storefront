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
      <main className="max-w-2xl mx-auto px-5 sm:px-8 py-10 sm:py-14 flex-1 w-full">
        <h1 className="font-display italic text-[24px] text-ink mb-8">Your Cart</h1>
        <CartList subdomain={subdomain} storeName={storeName} />
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
