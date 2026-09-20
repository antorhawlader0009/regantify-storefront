'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Download, Package, MapPin, Phone, ArrowRight } from 'lucide-react';
import { useTrackOrder } from '@/lib/useTrackOrder';
import { useStoreDisplayName } from '../lib/useStoreDisplayName';
import { formatPrice } from '../lib/formatPrice';
import { downloadOrderMemoPdf } from '../lib/orderMemoPdf';
import { useEffect, useState } from 'react';
import { getStoreSocialLinks } from '@/lib/socialLinksApi';
import { getStoreNavData, type StoreNavData } from '../lib/storeNavApi';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';

export function ThankYouView({ subdomain }: { subdomain: string }) {
  const { order, loading, justPlaced } = useTrackOrder(subdomain);
  const storeName = useStoreDisplayName(subdomain);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<Awaited<ReturnType<typeof getStoreSocialLinks>>>({});
  const [downloadingMemo, setDownloadingMemo] = useState(false);
  // Same reasoning as CheckoutView: this is a Client Component with no
  // server-fetched StorefrontListData, so the full category nav for
  // StoreHeader is fetched here — keeps the same complete header (with
  // its own logo at the left) on the confirmation page as everywhere
  // else, rather than a bare logo-only bar.
  const [nav, setNav] = useState<StoreNavData>({ categories: [], categoryDetails: [] });
  // Whether a handoff key is still sitting in sessionStorage right as
  // this component first mounts — read synchronously (not in an
  // effect) so the loading state below covers the one-frame gap
  // before useTrackOrder's own effect has run and set loading=true.
  // Without this, that gap would briefly show the "order not found"
  // fallback right after a real checkout, before flipping to the
  // actual confirmation.
  const [hasPendingHandoff] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('regantify-last-order') !== null;
  });

  useEffect(() => {
    getStoreSocialLinks(subdomain).then((b) => {
      setLogoUrl(b.logoUrl ?? null);
      setSocialLinks(b);
    });
    getStoreNavData(subdomain).then(setNav);
  }, [subdomain]);

  if ((loading || hasPendingHandoff) && !order) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <p className="text-muted text-[13.5px]">Loading your order…</p>
      </div>
    );
  }

  // No handoff / order not found (e.g. a direct visit or page refresh
  // after the handoff key was already consumed elsewhere) — send the
  // shopper to Track Order instead of showing a broken confirmation.
  if (!order) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-ink font-semibold text-[15px]">We couldn&apos;t find a recent order to confirm.</p>
        <p className="text-muted text-[13px]">Already placed an order? Track it instead.</p>
        <Link
          href={`/store/${subdomain}/orders`}
          className="mt-2 px-4 py-2 rounded-md bg-ink text-white text-[13px] font-bold"
        >
          Track Your Order
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <StoreHeader
        subdomain={subdomain}
        storeName={storeName}
        categories={nav.categories}
        categoryDetails={nav.categoryDetails}
        logoUrl={logoUrl}
        socialLinks={socialLinks}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Animated success mark */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="storepal-success-circle w-20 h-20 rounded-full bg-success-bg flex items-center justify-center mb-5">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="var(--color-success)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="storepal-success-check"
              />
            </svg>
          </div>
          <h1 className="storepal-fade-up text-[24px] sm:text-[28px] font-bold text-ink mb-2">
            {justPlaced ? 'Thank you for your order!' : 'Order confirmed'}
          </h1>
          <p className="storepal-fade-up text-[13.5px] text-muted max-w-md" style={{ animationDelay: '0.08s' }}>
            {order.paymentMethod === 'ONLINE_PAYMENT'
              ? 'Your payment was received and your order is confirmed. A confirmation call may follow shortly.'
              : 'Your order has been received and will be delivered with Cash on Delivery. A confirmation call may follow shortly.'}
          </p>
        </div>

        {/* Memo / invoice card */}
        <div className="storepal-fade-up bg-surface border border-line rounded-lg overflow-hidden shadow-card" style={{ animationDelay: '0.16s' }}>
          <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-4 border-b border-line bg-canvas">
            <div>
              <p className="text-[11px] text-muted uppercase tracking-wide">Order Memo</p>
              <p className="text-[17px] font-bold text-ink">ORDER-{order.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted uppercase tracking-wide">Placed On</p>
              <p className="text-[13px] font-medium text-ink">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="px-5 py-4 border-b border-line grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <MapPin size={15} className="text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] text-muted mb-0.5">Delivery Address</p>
                <p className="text-[13px] text-ink leading-snug">
                  {order.shippingAddress}
                  {order.shippingCity ? `, ${order.shippingCity}` : ''}
                  {order.shippingDistrict ? `, ${order.shippingDistrict}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone size={15} className="text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] text-muted mb-0.5">Customer</p>
                <p className="text-[13px] text-ink leading-snug">{order.customerName}</p>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative w-12 h-12 shrink-0 bg-canvas border border-line rounded overflow-hidden">
                  {item.productImage && <Image src={item.productImage} alt="" fill sizes="48px" className="object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-ink truncate">{item.productName}</p>
                  <p className="text-[11.5px] text-muted">
                    Qty {item.quantity} × {formatPrice(item.unitPrice)}
                  </p>
                </div>
                <span className="text-[13px] font-semibold text-ink shrink-0">{formatPrice(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-line space-y-1.5 text-[13px]">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Delivery Charge</span>
              <span>{formatPrice(order.deliveryCharge)}</span>
            </div>
            {Number(order.vatAmount) > 0 && (
              <div className="flex justify-between text-muted">
                <span>VAT</span>
                <span>{formatPrice(order.vatAmount)}</span>
              </div>
            )}
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 mt-1 border-t border-line text-[16px] font-bold text-ink">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-line bg-canvas flex items-center gap-2 text-[12.5px] text-ink">
            <Package size={14} className="text-accent" />
            Payment Method:{' '}
            <span className="font-semibold">{order.paymentMethod === 'ONLINE_PAYMENT' ? 'Online Payment' : 'Cash on Delivery'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="storepal-fade-up flex flex-col sm:flex-row gap-3 mt-6" style={{ animationDelay: '0.24s' }}>
          <button
            onClick={async () => {
              setDownloadingMemo(true);
              try {
                await downloadOrderMemoPdf(order, storeName, logoUrl);
              } finally {
                setDownloadingMemo(false);
              }
            }}
            disabled={downloadingMemo}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-md bg-ink hover:bg-ink/90 text-white text-[13.5px] font-bold transition-colors disabled:opacity-60"
          >
            <Download size={16} />
            {downloadingMemo ? 'Preparing memo…' : 'Download Memo (PDF)'}
          </button>
          <Link
            href={`/store/${subdomain}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-md border border-line-strong text-ink text-[13.5px] font-bold hover:bg-surface transition-colors"
          >
            Continue Shopping
            <ArrowRight size={15} />
          </Link>
        </div>

        <p className="storepal-fade-up text-center text-[12px] text-muted mt-5" style={{ animationDelay: '0.3s' }}>
          Need help with your order?{' '}
          <Link href={`/store/${subdomain}/orders`} className="text-accent font-medium hover:text-accent-dark">
            Track it anytime
          </Link>
          .
        </p>
      </main>

      <StoreFooter subdomain={subdomain} storeName={storeName} logoUrl={logoUrl} socialLinks={socialLinks} />
    </div>
  );
}
