'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
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
      <header className="border-b border-line">
        <div className="max-w-sm mx-auto px-5 sm:px-8 py-5">
          <Link href={`/store/${subdomain}`} className="inline-flex items-center gap-1.5 text-[13px] text-ink hover:text-accent transition-colors">
            <ArrowLeft size={14} strokeWidth={1.5} />
            Back to store
          </Link>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-5 sm:px-8 py-14">
        <h1 className="font-display italic text-[24px] text-ink mb-1.5">Log in</h1>
        <p className="text-[13px] text-muted mb-8">See your order history and check out faster.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            autoFocus
            className="w-full px-0 py-2.5 bg-transparent border-b border-line text-[13.5px] outline-none transition-colors focus:border-ink placeholder:text-muted"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-0 py-2.5 bg-transparent border-b border-line text-[13.5px] outline-none transition-colors focus:border-ink placeholder:text-muted"
          />

          {error && <p className="text-[12px] text-accent-dark">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-ink hover:bg-accent-dark text-white text-[12.5px] tracking-[0.04em] uppercase disabled:opacity-60 transition-colors"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-8 text-[12.5px] text-muted text-center">
          Don&apos;t have an account?{' '}
          <Link href={`/store/${subdomain}/account/signup`} className="text-ink border-b border-ink pb-0.5">
            Sign up
          </Link>
        </p>
      </main>
    </div>
  );
}
