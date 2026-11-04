'use client';

import Link from 'next/link';
import type { StorefrontProduct } from '@/lib/storefrontApi';
import { RatingStars } from '@/components/RatingStars';
import { ShareButton } from '../storepal/components/ShareButton';
import { ProductTrustRow } from '../storepal/components/TrustStrip';
import { DeliveryCheck } from '../storepal/components/DeliveryCheck';
import { ProductPolicyLines } from '../storepal/components/ProductPolicyLines';
import { useStorePalDesign } from '../storepal/lib/designSettings';
import { useStoreText } from '../storepal/lib/storeText';
import type { ResolvedPolicy } from '../storepal/lib/policy';
import { PlaymateBreadcrumb } from './PlaymateBreadcrumb';

/** The template's product head: breadcrumb, title, then brand, stars and reviews in one row (share on the right). */
export function PlaymateProductHead({ subdomain, product }: { subdomain: string; product: StorefrontProduct }) {
  const t = useStoreText();
  const design = useStorePalDesign();
  const base = `/store/${subdomain}`;
  const crumbs = [
    ...(product.category ? [{ label: product.category, href: `${base}?category=${encodeURIComponent(product.category)}` }] : []),
    { label: product.name },
  ];
  return (
    <div>
      <PlaymateBreadcrumb subdomain={subdomain} homeLabel={t('Home')} items={crumbs} />
      {product.badgeText && (
        <span
          className="mt-3 inline-block rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
          style={design.productBadgeColor ? { backgroundColor: design.productBadgeColor } : undefined}
        >
          {product.badgeText}
        </span>
      )}
      <div className="mt-3 flex items-start justify-between gap-3">
        <h1 data-rg="product-title" className="text-2xl font-extrabold tracking-tight sm:text-[28px]">
          {product.name}
        </h1>
        {!product.quoteOnly && <ShareButton name={product.name} price={Number(product.discountPrice ?? product.price)} />}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
        {product.brand && (
          <span>
            {t('Brand')}:{' '}
            <Link href={`${base}?brand=${encodeURIComponent(product.brand)}`} className="font-semibold text-ink hover:text-accent">
              {product.brand}
            </Link>
          </span>
        )}
        <button type="button" onClick={() => window.dispatchEvent(new Event('storepal:open-reviews'))} className="flex items-center gap-1.5 hover:text-accent">
          {product.rating ? <RatingStars rating={product.rating} size={13} showCount={false} label={`${product.rating.average} / 5`} /> : null}
          {product.rating ? t('{n} reviews').replace('{n}', String(product.rating.count)) : t('Write a review')}
        </button>
        {product.category && (
          <span>
            {t('Category')}:{' '}
            <Link href={`${base}?category=${encodeURIComponent(product.category)}`} className="font-semibold text-ink hover:text-accent">
              {product.category}
            </Link>
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * The template's side box ("Delivery information"): the store's own delivery and trust lines, the delivery check by
 * district, the warranty and returns, then the product's categories. Nothing is promised that the store didn't set.
 */
export function PlaymateProductSide({ subdomain, product, policy }: { subdomain: string; product: StorefrontProduct; policy: ResolvedPolicy | null }) {
  const t = useStoreText();
  const base = `/store/${subdomain}`;
  const quote = !!product.quoteOnly;
  const tags = product.secondaryCategories.filter((c) => c !== product.category);
  return (
    <aside className="space-y-3 md:col-span-2 lg:col-span-1" aria-label={t('Delivery information')}>
      {!quote && !product.comingSoon && (
        <div className="rounded-md bg-accent-light px-4 py-3 text-[13px] font-semibold leading-snug text-accent">
          <ProductTrustRow subdomain={subdomain} preOrder={!!product.isPreOrder} />
        </div>
      )}
      {!quote && (
        <div className="rounded-md bg-[var(--pm-card)] p-4 text-[12px]">
          <DeliveryCheck subdomain={subdomain} />
          {policy && (
            <div className="mt-3">
              <ProductPolicyLines policy={policy} />
            </div>
          )}
        </div>
      )}
      {(product.category || tags.length > 0 || product.brand) && (
        <dl className="space-y-1 px-1 text-[12px] text-muted">
          {product.category && (
            <div>
              {t('Category')}:{' '}
              <Link href={`${base}?category=${encodeURIComponent(product.category)}`} className="font-bold text-ink hover:text-accent">
                {product.category}
              </Link>
            </div>
          )}
          {tags.length > 0 && (
            <div>
              {t('Tags')}: <b className="text-ink">{tags.join(', ')}</b>
            </div>
          )}
          {product.brand && (
            <div>
              {t('Brand')}:{' '}
              <Link href={`${base}?brand=${encodeURIComponent(product.brand)}`} className="font-bold text-ink hover:text-accent">
                {product.brand}
              </Link>
            </div>
          )}
        </dl>
      )}
    </aside>
  );
}
