import Image from 'next/image';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { ProductCard } from '../components/ProductCard';
import { useStoreText } from '../lib/storeText';

interface CollectionViewProps {
  subdomain: string;
  storeName: string;
  categories: string[];
  collection: { name: string; coverPhotoUrl: string | null; content: string | null };
  products: StorefrontProduct[];
}

/**
 * A collection's public page on StorePal (TellMe idea 72): cover and name, the vendor's own text, and the products. For a smart
 * collection the server finds the products when the page is opened, so what shows is always what the rules match now.
 */
export function CollectionView({ subdomain, storeName, categories, collection, products }: CollectionViewProps) {
  const t = useStoreText();
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={categories} />
      {collection.coverPhotoUrl ? (
        <div className="relative w-full aspect-[1200/633] max-h-[360px] bg-ink overflow-hidden">
          <Image src={collection.coverPhotoUrl} alt={collection.name} fill sizes="100vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 max-w-6xl mx-auto px-4 sm:px-6 pb-6">
            <h1 className="text-[26px] sm:text-[38px] font-bold text-white leading-tight">{collection.name}</h1>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
          <h1 className="text-[26px] sm:text-[32px] font-bold text-ink">{collection.name}</h1>
        </div>
      )}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {collection.content && (
          <div className="mb-6 text-[14px] leading-relaxed text-ink [&_a]:underline" dangerouslySetInnerHTML={{ __html: collection.content }} />
        )}
        {products.length === 0 ? (
          <div className="text-center py-20 bg-surface border border-line">
            <p className="text-lg font-semibold text-ink mb-1.5">{t('Nothing here yet')}</p>
            <p className="text-[13.5px] text-muted">{t('No products in this collection right now. Check back soon.')}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} subdomain={subdomain} storeName={storeName} />
            ))}
          </div>
        )}
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
