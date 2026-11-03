import Image from 'next/image';
import { Store } from 'lucide-react';
import { formatTaka, shopProductPath, type ShopItem } from '@/lib/shopApi';

/**
 * One product in the Regantify Shop (2026-11-03 redesign, the app's marketplace look): a white card with a soft shadow, the photo in a
 * rounded frame with the discount or "Out of stock" tag on it, the name, the price in the accent colour and the store's name. It opens the
 * Shop's own product page (/shop/p/<store>/<slug>), where one sign-in buys from any store.
 */
export function ProductCard({ item, priority = false }: { item: ShopItem; priority?: boolean }) {
  const onSale = item.listPrice > item.price;
  const off = onSale ? Math.round((1 - item.price / item.listPrice) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <a
        href={item.slug ? shopProductPath(item.store.subdomain, item.slug) : item.url}
        className="group flex flex-1 flex-col overflow-hidden rounded-2xl bg-white p-2 shadow-[0_2px_12px_rgba(16,24,40,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(16,24,40,0.12)]"
      >
        <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
          {item.photoUrl ? (
            <Image
              src={item.photoUrl}
              alt={item.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              className="object-cover transition duration-300 group-hover:scale-[1.04]"
            />
          ) : null}
          {!item.inStock ? (
            <span className="absolute left-2 top-2 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-[11px] font-semibold text-white">Out of stock</span>
          ) : off > 0 ? (
            <span className="absolute left-2 top-2 rounded-full bg-[var(--shop-accent)] px-2.5 py-0.5 text-[11px] font-bold text-white">-{off}%</span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-1 px-1 pb-1 pt-2.5">
          <p className="line-clamp-2 text-[13px] font-medium leading-snug text-slate-900">{item.name}</p>
          <p className="mt-auto flex flex-wrap items-baseline gap-x-2">
            <span className="text-base font-bold text-[var(--shop-accent)]">{formatTaka(item.price)}</span>
            {onSale ? <span className="text-xs text-slate-400 line-through">{formatTaka(item.listPrice)}</span> : null}
          </p>
          <p className="flex items-center gap-1 truncate text-[11px] text-slate-500">
            <Store size={12} aria-hidden className="shrink-0" />
            <span className="truncate">{item.store.name}</span>
          </p>
        </div>
      </a>
      {item.alsoSoldBy > 0 ? (
        // Step 15: other stores sell the same thing: a search for its name puts them side by side.
        <a href={`/shop/search?q=${encodeURIComponent(item.name.slice(0, 80))}`} className="px-2 text-[11px] font-medium text-[var(--shop-accent)] hover:underline">
          Compare prices in {item.alsoSoldBy + 1} stores
        </a>
      ) : null}
    </div>
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
