import Image from 'next/image';
import { formatTaka, shopProductPath, type ShopItem } from '@/lib/shopApi';

/**
 * One product in the Regantify Shop (SHOP-plan.md Step 7). Since 2026-11-03 the card opens the Shop's own product page (/shop/p/<store>/<slug>),
 * where a shopper signed in once buys from any store; that page also links to the store's own page.
 */
export function ProductCard({ item, priority = false }: { item: ShopItem; priority?: boolean }) {
  if (item.alsoSoldBy <= 0) return <CardLink item={item} priority={priority} />;
  // Step 15: other stores sell the same thing (same barcode, or same brand and name): a search for its name puts them side by side.
  return (
    <div className="flex flex-col gap-1">
      <CardLink item={item} priority={priority} />
      <a href={`/shop/search?q=${encodeURIComponent(item.name.slice(0, 80))}`} className="px-1 text-xs font-medium text-emerald-700 hover:underline">
        Compare prices in {item.alsoSoldBy + 1} stores
      </a>
    </div>
  );
}

function CardLink({ item, priority }: { item: ShopItem; priority: boolean }) {
  const onSale = item.listPrice > item.price;
  return (
    <a href={item.slug ? shopProductPath(item.store.subdomain, item.slug) : item.url} className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-emerald-600 hover:shadow-md">
      <div className="relative aspect-square bg-slate-100">
        {item.photoUrl ? (
          <Image
            src={item.photoUrl}
            alt={item.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-cover transition group-hover:scale-[1.02]"
          />
        ) : null}
        {!item.inStock ? <span className="absolute left-2 top-2 rounded bg-slate-900/80 px-2 py-0.5 text-xs font-medium text-white">Out of stock</span> : null}
        {onSale && item.inStock ? (
          <span className="absolute left-2 top-2 rounded bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
            {Math.round((1 - item.price / item.listPrice) * 100)}% off
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-slate-900">{item.name}</p>
        <p className="mt-auto flex items-baseline gap-2">
          <span className="text-base font-semibold text-slate-900">{formatTaka(item.price)}</span>
          {onSale ? <span className="text-xs text-slate-400 line-through">{formatTaka(item.listPrice)}</span> : null}
        </p>
        <p className="truncate text-xs text-slate-500">
          {item.store.name}
          {item.alsoSoldBy > 0 ? ` · also at ${item.alsoSoldBy} more ${item.alsoSoldBy === 1 ? 'store' : 'stores'}` : ''}
        </p>
      </div>
    </a>
  );
}

export function ProductGrid({ items, priorityFirst = 0 }: { items: ShopItem[]; priorityFirst?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {items.map((item, i) => (
        <ProductCard key={item.productId} item={item} priority={i < priorityFirst} />
      ))}
    </div>
  );
}
