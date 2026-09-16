'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { customerLogin, otpLoginSend, otpLoginVerify } from '@/lib/customerAuthApi';
import { useCustomerAuthStore } from '@/providers/customer-auth-store-provider';
import { StoreHeader } from '../../components/StoreHeader';
import { StoreFooter } from '../../components/StoreFooter';
import { useStoreDisplayName } from '../../lib/useStoreDisplayName';

type LoginMode = 'select' | 'email' | 'otp';

/**
 * Matches the reference "Login" screenshots exactly: a "Select login
 * option" screen with Email Login / OTP Login buttons, then each
 * option's own form. OTP Login is two steps (send code, then enter it)
 * — see CustomerAuthService.otpLoginSend/otpLoginVerify on the backend.
 */
export function LoginView({ subdomain }: { subdomain: string }) {
  const router = useRouter();
  const storeName = useStoreDisplayName(subdomain);
  const setSession = useCustomerAuthStore((s) => s.setSession);

  const [mode, setMode] = useState<LoginMode>('select');

  // Email Login
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP Login
  const [phone, setPhone] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'code'>('phone');
  const [code, setCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password.trim()) {
      setError('Enter your email/phone and password.');
      return;
    }
    setLoading(true);
    try {
      const result = await customerLogin(identifier.trim(), password);
      setSession(result.customer, result.accessToken);
      router.push(`/store/${subdomain}/account/orders`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    if (!phone.trim()) {
      setOtpError('Enter your phone number.');
      return;
    }
    setOtpLoading(true);
    try {
      await otpLoginSend(phone.trim(), subdomain);
      setOtpStep('code');
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Could not send OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    if (!code.trim()) {
      setOtpError('Enter the code sent to your phone.');
      return;
    }
    setOtpLoading(true);
    try {
      const result = await otpLoginVerify(phone.trim(), code.trim());
      setSession(result.customer, result.accessToken);
      router.push(`/store/${subdomain}/account/orders`);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Could not verify code.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={[]} />

      <main className="max-w-md mx-auto px-4 sm:px-6 py-12 flex-1 w-full">
        <div className="bg-surface border border-line rounded-lg p-6 sm:p-7">
          <h1 className="text-[24px] font-bold text-ink mb-5">Login</h1>

          {mode === 'select' && (
            <div className="space-y-3">
              <p className="text-[14px] font-semibold text-ink mb-2">Select login option</p>
              <button
                onClick={() => setMode('email')}
                className="w-full py-3 rounded-md border border-line-strong text-[13.5px] font-medium text-ink hover:border-ink transition-colors"
              >
                Email Login
              </button>
              <button
                onClick={() => setMode('otp')}
                className="w-full py-3 rounded-md border border-line-strong text-[13.5px] font-medium text-ink hover:border-ink transition-colors"
              >
                OTP Login
              </button>
            </div>
          )}

          {mode === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-3.5">
              <div>
                <label className="block text-[13px] font-medium text-ink mb-1.5">Email or Phone Number</label>
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value.slice(0, 150))}
                  autoFocus
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

              <div className="flex flex-col gap-1 text-[13px]">
                <button type="button" onClick={() => setMode('select')} className="text-accent hover:text-accent-dark w-fit">
                  Other Login options
                </button>
                <Link href={`/store/${subdomain}/account/forgot-password`} className="text-accent hover:text-accent-dark w-fit">
                  Forgot Password?
                </Link>
                <span className="text-ink">
                  New user?{' '}
                  <Link href={`/store/${subdomain}/account/signup`} className="text-accent hover:text-accent-dark">
                    Register here
                  </Link>
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-md bg-ink hover:bg-ink/90 text-white text-[13.5px] font-bold disabled:opacity-60 transition-colors"
              >
                {loading ? 'Logging in…' : 'Login'}
              </button>
            </form>
          )}

          {mode === 'otp' && otpStep === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div>
                <label className="block text-[13px] font-medium text-ink mb-1.5">Phone Number</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.slice(0, 30))}
                  placeholder="01XXXXXXXXX"
                  autoFocus
                  maxLength={30}
                  className="w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-surface text-[13.5px] outline-none focus:border-ink transition-colors"
                />
              </div>

              {otpError && <p className="text-[12.5px] text-accent">{otpError}</p>}

              <button type="button" onClick={() => setMode('select')} className="text-[13px] text-accent hover:text-accent-dark w-fit block">
                Other Login options
              </button>

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full py-3 rounded-md bg-ink hover:bg-ink/90 text-white text-[13.5px] font-bold disabled:opacity-60 transition-colors"
              >
                {otpLoading ? 'Sending…' : 'Send Code'}
              </button>
            </form>
          )}

          {mode === 'otp' && otpStep === 'code' && (
            <form onSubmit={handleVerifyOtp} className="space-y-3.5">
              <p className="text-[13px] text-muted">Enter the 6-digit code sent to {phone}.</p>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.slice(0, 6))}
                placeholder="6-digit code"
                autoFocus
                maxLength={6}
                className="w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-surface text-[13.5px] outline-none focus:border-ink transition-colors text-center tracking-[0.3em]"
              />

              {otpError && <p className="text-[12.5px] text-accent">{otpError}</p>}

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full py-3 rounded-md bg-ink hover:bg-ink/90 text-white text-[13.5px] font-bold disabled:opacity-60 transition-colors"
              >
                {otpLoading ? 'Verifying…' : 'Verify & Login'}
              </button>
            </form>
          )}
        </div>
      </main>

      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
