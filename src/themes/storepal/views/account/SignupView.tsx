'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { customerSignup, verifyCustomerSignup } from '@/lib/customerAuthApi';
import { useCustomerAuthStore } from '@/providers/customer-auth-store-provider';
import { StoreHeader } from '../../components/StoreHeader';
import { StoreFooter } from '../../components/StoreFooter';
import { useStoreDisplayName } from '../../lib/useStoreDisplayName';
import { trackMetaCompleteRegistration } from '@/lib/metaPixelEvents';

export function SignupView({ subdomain }: { subdomain: string }) {
  const router = useRouter();
  const storeName = useStoreDisplayName(subdomain);
  const setSession = useCustomerAuthStore((s) => s.setSession);

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !phone.trim() || !password.trim()) {
      setError('Please fill in your name, phone number, and password.');
      return;
    }
    setLoading(true);
    try {
      await customerSignup(phone.trim(), fullName.trim(), password, email.trim() || undefined, subdomain);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code.trim()) {
      setError('Enter the code sent to your phone.');
      return;
    }
    setLoading(true);
    try {
      const result = await verifyCustomerSignup(phone.trim(), code.trim());
      setSession(result.customer, result.accessToken);
      trackMetaCompleteRegistration();
      router.push(`/store/${subdomain}/account/orders`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={[]} />

      <main className="max-w-md mx-auto px-4 sm:px-6 py-12 flex-1 w-full">
        <div className="bg-surface border border-line rounded-lg p-6 sm:p-7">
          <h1 className="text-[24px] font-bold text-ink mb-5">{step === 'form' ? 'New Account' : 'Verify Phone'}</h1>

          {step === 'form' ? (
            <form onSubmit={handleCreateAccount} className="space-y-3.5">
              <div>
                <label className="block text-[13px] font-medium text-ink mb-1.5">Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value.slice(0, 100))}
                  autoFocus
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-surface text-[13.5px] outline-none focus:border-ink transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-ink mb-1.5">Phone Number</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.slice(0, 30))}
                  placeholder="01XXXXXXXXX"
                  maxLength={30}
                  className="w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-surface text-[13.5px] outline-none focus:border-ink transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-ink mb-1.5">Email (optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.slice(0, 150))}
                  maxLength={150}
                  className="w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-surface text-[13.5px] outline-none focus:border-ink transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-ink mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.slice(0, 72))}
                  maxLength={72}
                  className="w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-surface text-[13.5px] outline-none focus:border-ink transition-colors"
                />
              </div>

              {error && <p className="text-[12.5px] text-accent">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-md bg-ink hover:bg-ink/90 text-white text-[13.5px] font-bold disabled:opacity-60 transition-colors"
              >
                {loading ? 'Creating…' : 'Create Account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-3.5">
              <p className="text-[13px] text-muted">We sent a 6-digit code to {phone}.</p>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.slice(0, 6))}
                placeholder="6-digit code"
                autoFocus
                maxLength={6}
                className="w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-surface text-[13.5px] outline-none focus:border-ink transition-colors text-center tracking-[0.3em]"
              />

              {error && <p className="text-[12.5px] text-accent">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-md bg-ink hover:bg-ink/90 text-white text-[13.5px] font-bold disabled:opacity-60 transition-colors"
              >
                {loading ? 'Verifying…' : 'Verify & Continue'}
              </button>
            </form>
          )}
        </div>
      </main>

      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
