'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, Phone } from 'lucide-react';
import { customerLogin } from '@/lib/customerAuthApi';
import { useCustomerAuthStore } from '@/providers/customer-auth-store-provider';

export function LoginView({ subdomain }: { subdomain: string }) {
  const router = useRouter();
  const setSession = useCustomerAuthStore((s) => s.setSession);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone.trim() || !password.trim()) {
      setError('Enter your phone number and password.');
      return;
    }
    setLoading(true);
    try {
      const result = await customerLogin(phone.trim(), password);
      setSession(result.customer, result.accessToken);
      router.push(`/store/${subdomain}/account/orders`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="bg-surface border-b border-line">
        <div className="max-w-md mx-auto px-4 sm:px-6 py-4">
          <Link href={`/store/${subdomain}`} className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink hover:text-accent">
            <ArrowLeft size={14} />
            Back to store
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 sm:px-6 py-10">
        <div className="bg-surface border border-line rounded-lg p-5 sm:p-7 shadow-card">
          <h1 className="text-[19px] font-bold text-ink mb-1.5">Log in</h1>
          <p className="text-[13px] text-muted mb-6">See your order history and check out faster.</p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={16} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                autoFocus
                className="w-full pl-10 pr-3.5 py-2.5 rounded-md border border-line bg-canvas text-[13.5px] outline-none transition-colors focus:border-ink focus:bg-surface"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-md border border-line bg-canvas text-[13.5px] outline-none transition-colors focus:border-ink focus:bg-surface"
              />
            </div>

            {error && <p className="text-[12.5px] text-accent">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md bg-accent hover:bg-accent-dark text-white text-[13.5px] font-bold disabled:opacity-60 shadow-sm transition-colors"
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="mt-6 text-[12.5px] text-muted text-center">
            Don&apos;t have an account?{' '}
            <Link href={`/store/${subdomain}/account/signup`} className="text-accent font-medium hover:text-accent-dark">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
