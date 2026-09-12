'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, LogOut } from 'lucide-react';
import { listCustomerOrders, type CustomerOrder } from '@/lib/customerAuthApi';
import { formatPrice } from '@/lib/productDisplay';
import { customerOrderStatusLabel } from '@/lib/orderStatusDisplay';
import {
  useCustomerAuthStore,
  useCustomerAuthHydrated,
  useCustomerLogout,
} from '@/providers/customer-auth-store-provider';

export function AccountOrdersView({ subdomain }: { subdomain: string }) {
  const hydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const accessToken = useCustomerAuthStore((s) => s.accessToken);
  const logout = useCustomerLogout();

  const [orders, setOrders] = useState<CustomerOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated || !accessToken) return;
    listCustomerOrders(subdomain, accessToken)
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load your orders.'));
  }, [hydrated, accessToken, subdomain]);

  if (hydrated && !customer) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-5">
        <div className="max-w-sm w-full text-center">
          <Package size={26} strokeWidth={1.5} className="mx-auto text-muted mb-4" />
          <p className="text-[15px] text-ink font-display italic mb-1">Log in to see your orders</p>
          <p className="text-[12.5px] text-muted mb-6">Your order history is tied to your account.</p>
          <Link
            href={`/store/${subdomain}/account/login`}
            className="inline-block px-6 py-2.5 bg-ink hover:bg-accent-dark text-white text-[12.5px] tracking-[0.04em] uppercase transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
          <Link href={`/store/${subdomain}`} className="inline-flex items-center gap-1.5 text-[13px] text-ink hover:text-accent transition-colors">
            <ArrowLeft size={14} strokeWidth={1.5} />
            Back to store
          </Link>
          {customer && (
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-ink transition-colors"
            >
              <LogOut size={13} strokeWidth={1.5} />
              Log out
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 sm:px-8 py-10">
        <div className="mb-6">
          <h1 className="font-display italic text-[22px] text-ink mb-1">My Orders</h1>
          {customer && <p className="text-[13px] text-muted">{customer.fullName} · {customer.phone}</p>}
        </div>

        {customer && (
          <div className="flex gap-4 mb-7 text-[12px] pb-4 border-b border-line">
            <span className="text-ink">My Orders</span>
            <Link
              href={`/store/${subdomain}/account/profile`}
              className="text-muted hover:text-ink transition-colors"
            >
              Edit Profile
            </Link>
          </div>
        )}

        {error && <div className="text-[13px] text-accent-dark">{error}</div>}

        {!error && orders === null && (
          <div className="text-center py-14 text-[13px] text-muted">Loading your orders…</div>
        )}

        {orders && orders.length === 0 && (
          <div className="text-center py-14">
            <Package size={24} strokeWidth={1.5} className="mx-auto text-muted mb-3" />
            <p className="text-[14px] text-ink font-display italic mb-1">No orders yet</p>
            <p className="text-[12.5px] text-muted mb-5">Orders you place with this store will show up here.</p>
            <Link
              href={`/store/${subdomain}`}
              className="inline-block px-5 py-2.5 bg-ink hover:bg-accent-dark text-white text-[12px] tracking-[0.04em] uppercase transition-colors"
            >
              Start shopping
            </Link>
          </div>
        )}

        {orders && orders.length > 0 && (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="pb-6 border-b border-line last:border-0">
                <div className="flex items-center justify-between mb-3.5">
                  <div>
                    <p className="text-[11px] text-muted">Order</p>
                    <p className="text-[14.5px] font-display italic text-ink">ORDER-{order.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-muted">{new Date(order.createdAt).toLocaleDateString()}</p>
                    <p className="text-[12px] text-ink mt-0.5">{customerOrderStatusLabel(order.status)}</p>
                  </div>
                </div>

                <div className="space-y-2.5 mb-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative w-10 h-10 shrink-0 bg-canvas overflow-hidden">
                        {item.productImage && <Image src={item.productImage} alt="" fill sizes="40px" className="object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] text-ink truncate">{item.productName}</p>
                        <p className="text-[11px] text-muted">Qty {item.quantity}</p>
                      </div>
                      <span className="text-[12.5px] text-ink">{formatPrice(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-2.5 border-t border-line text-[13px] text-ink">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
