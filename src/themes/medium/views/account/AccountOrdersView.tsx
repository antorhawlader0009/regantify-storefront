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
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-4">
        <div className="bg-surface border border-line rounded-lg p-6 max-w-sm w-full text-center shadow-card">
          <Package size={28} className="mx-auto text-muted mb-3" />
          <p className="text-[14px] text-ink font-semibold mb-1">Log in to see your orders</p>
          <p className="text-[12.5px] text-muted mb-4">Your order history is tied to your account.</p>
          <Link
            href={`/store/${subdomain}/account/login`}
            className="inline-block px-5 py-2.5 rounded-md bg-accent hover:bg-accent-dark text-white text-[13px] font-bold shadow-sm transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="bg-surface border-b border-line">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href={`/store/${subdomain}`} className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink hover:text-accent">
            <ArrowLeft size={14} />
            Back to store
          </Link>
          {customer && (
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted hover:text-accent transition-colors"
            >
              <LogOut size={13} />
              Log out
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-5">
          <h1 className="text-[19px] font-bold text-ink mb-1">My Orders</h1>
          {customer && <p className="text-[13px] text-muted">{customer.fullName} · {customer.phone}</p>}
        </div>

        {customer && (
          <div className="flex gap-3 mb-5 text-[12.5px]">
            <span className="text-ink font-semibold">My Orders</span>
            <span className="text-line">·</span>
            <Link
              href={`/store/${subdomain}/account/profile`}
              className="text-muted hover:text-accent font-medium"
            >
              Edit Profile
            </Link>
          </div>
        )}

        {error && (
          <div className="bg-surface border border-line rounded-lg p-4 text-[13px] text-accent">{error}</div>
        )}

        {!error && orders === null && (
          <div className="bg-surface border border-line rounded-lg p-6 text-center text-[13px] text-muted">
            Loading your orders…
          </div>
        )}

        {orders && orders.length === 0 && (
          <div className="bg-surface border border-line rounded-lg p-6 text-center shadow-card">
            <Package size={26} className="mx-auto text-muted mb-2.5" />
            <p className="text-[13.5px] text-ink font-medium mb-1">No orders yet</p>
            <p className="text-[12.5px] text-muted mb-4">Orders you place with this store will show up here.</p>
            <Link
              href={`/store/${subdomain}`}
              className="inline-block px-4 py-2 rounded-md bg-accent hover:bg-accent-dark text-white text-[12.5px] font-bold shadow-sm transition-colors"
            >
              Start shopping
            </Link>
          </div>
        )}

        {orders && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-surface border border-line rounded-lg p-4 sm:p-5 shadow-card">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-line">
                  <div>
                    <p className="text-[12px] text-muted">Order</p>
                    <p className="text-[14.5px] font-bold text-ink">ORDER-{order.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-muted">{new Date(order.createdAt).toLocaleDateString()}</p>
                    <p className="text-[12.5px] font-semibold text-accent mt-0.5">{customerOrderStatusLabel(order.status)}</p>
                  </div>
                </div>

                <div className="space-y-2.5 mb-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative w-10 h-10 shrink-0 bg-canvas border border-line rounded overflow-hidden">
                        {item.productImage && <Image src={item.productImage} alt="" fill sizes="40px" className="object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] text-ink truncate">{item.productName}</p>
                        <p className="text-[11px] text-muted">Qty {item.quantity}</p>
                      </div>
                      <span className="text-[12.5px] font-semibold text-ink">{formatPrice(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-2.5 border-t border-line text-[13px] font-bold text-ink">
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
