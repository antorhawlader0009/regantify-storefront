'use client';

import { PackageCheck } from 'lucide-react';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { formatPrice as plainPrice } from '../lib/formatPrice';
import { bnDigits, useFormatPrice } from '../lib/storeText';
import { useStorePalDesign } from '../lib/designSettings';

/**
 * A bundle / combo's product page (TellMe idea 51): what is inside the set, what it would cost bought one by one, and how
 * much the shopper saves. Nothing for a plain product. The set's stock already comes from its parts (the server sends the
 * fewest sets they allow as the product's stock), so "Out of stock" and the quantity limit work as for any product.
 */
export function BundleIncludes({ product }: { product: StorefrontProduct }) {
  const formatPrice = useFormatPrice(plainPrice);
  const design = useStorePalDesign();
  const bn = design.storeLanguage === 'bn';
  const bundle = product.bundle;
  if (!bundle || bundle.items.length === 0) return null;

  const price = Number(product.discountPrice ?? product.price);
  const saving = bundle.separateTotal - price;
  const count = (n: number) => (bn ? bnDigits(n) : String(n));

  return (
    <div className="mt-3 rounded-md border border-line bg-canvas px-3.5 py-3 text-[13px] text-ink">
      <p className="m-0 flex items-center gap-1.5 font-semibold">
        <PackageCheck size={15} className="shrink-0" />
        {bn ? 'এই সেটে আছে' : 'This set includes'}
      </p>
      <ul className="m-0 mt-1.5 list-none space-y-0.5 p-0">
        {bundle.items.map((item, i) => (
          <li key={`${item.name}-${i}`}>
            {count(item.quantity)} × {item.name}
          </li>
        ))}
      </ul>
      {bundle.separateTotal > 0 && (
        <p className="m-0 mt-2 text-muted">
          {bn ? 'আলাদা আলাদা কিনলে' : 'Bought separately'}: <span className="line-through">{formatPrice(bundle.separateTotal)}</span>
          {saving > 0 && (
            <span className="ml-2 font-semibold text-success">
              {bn ? `আপনার সাশ্রয় ${formatPrice(saving)}` : `You save ${formatPrice(saving)}`}
            </span>
          )}
        </p>
      )}
    </div>
  );
}
