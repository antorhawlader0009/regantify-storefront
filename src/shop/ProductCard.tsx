import Image from 'next/image';
import { formatTaka, type ShopItem } from '@/lib/shopApi';

/**
 * One product in the Regantify Shop (SHOP-plan.md Step 7). The whole card links to the product on its store's own page (the address
 * already carries utm_source=shop, so the store's Analytics counts the visit and any order as "Regantify Shop"). Buying happens there.
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
    <a href={item.url} className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-emerald-600 hover:shadow-md">
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

/**
 * A Reseller tab card (SHOP-plan.md Step 8): the product card, then the supplier's public badge and "Sell this in your store", a link into the
 * dashboard's reseller catalog opened on this offer (the seller signs in there; the Shop never asks). What a reseller earns is shown only there.
 */
function ResellerCard({ item, priority }: { item: ShopItem; priority: boolean }) {
  const resale = item.resale;
  return (
    <div className="flex flex-col gap-2">
      <ProductCard item={item} priority={priority} />
      {resale ? (
        <div className="flex flex-col gap-1.5 px-1">
          {resale.supplierBadge ? (
            <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${resale.supplierBadge === 'RELIABLE' ? 'bg-emerald-50 text-emerald-800' : 'bg-sky-50 text-sky-800'}`}>
              {resale.supplierBadge === 'RELIABLE' ? 'Reliable supplier' : 'New supplier'}
            </span>
          ) : null}
          {resale.resellUrl ? (
            <a href={resale.resellUrl} className="rounded-lg border border-emerald-700 px-3 py-1.5 text-center text-xs font-medium text-emerald-800 hover:bg-emerald-50">
              Sell this in your store
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ProductGrid({ items, priorityFirst = 0, reseller = false }: { items: ShopItem[]; priorityFirst?: number; reseller?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {items.map((item, i) =>
        reseller ? (
          <ResellerCard key={item.productId} item={item} priority={i < priorityFirst} />
        ) : (
          <ProductCard key={item.productId} item={item} priority={i < priorityFirst} />
        ),
      )}
    </div>
  );
}
