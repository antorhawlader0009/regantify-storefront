'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, Phone, User } from 'lucide-react';
import { customerSignup, resendSignupOtp, verifyCustomerSignup } from '@/lib/customerAuthApi';
import { useCustomerAuthStore } from '@/providers/customer-auth-store-provider';

type Step = 'details' | 'otp';

export default function CustomerSignupPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = use(params);
  const router = useRouter();
  const setSession = useCustomerAuthStore((s) => s.setSession);

  const [step, setStep] = useState<Step>('details');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone.trim() || !fullName.trim() || password.length < 6) {
      setError('Fill in your phone number, full name, and a password of at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await customerSignup(phone.trim(), fullName.trim(), password);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResent(false);
    try {
      await resendSignupOtp(phone.trim(), fullName.trim(), password);
      setResent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the OTP.');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.trim().length !== 6) {
      setError('Enter the 6-digit code sent to your phone.');
      return;
    }
    setLoading(true);
    try {
      const result = await verifyCustomerSignup(phone.trim(), code.trim());
      setSession(result.customer, result.accessToken);
      router.push(`/store/${subdomain}/account/orders`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify that code.');
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
          <h1 className="text-[19px] font-bold text-ink mb-1.5">Create your account</h1>
          <p className="text-[13px] text-muted mb-6">
            {step === 'details'
              ? 'Sign up to track your orders and check out faster next time.'
              : `Enter the 6-digit code we sent to ${phone}.`}
          </p>

          {step === 'details' ? (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={16} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-md border border-line bg-canvas text-[13.5px] outline-none transition-colors focus:border-ink focus:bg-surface"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={16} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number (e.g. 017XXXXXXXX)"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-md border border-line bg-canvas text-[13.5px] outline-none transition-colors focus:border-ink focus:bg-surface"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 characters)"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-md border border-line bg-canvas text-[13.5px] outline-none transition-colors focus:border-ink focus:bg-surface"
                />
              </div>

              {error && <p className="text-[12.5px] text-accent">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-md bg-accent hover:bg-accent-dark text-white text-[13.5px] font-bold disabled:opacity-60 shadow-sm transition-colors"
              >
                {loading ? 'Sending code…' : 'Send verification code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-3.5">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit code"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-md border border-line bg-canvas text-[15px] tracking-[0.3em] text-center outline-none transition-colors focus:border-ink focus:bg-surface"
              />

              {error && <p className="text-[12.5px] text-accent">{error}</p>}
              {resent && <p className="text-[12.5px] text-success">A new code has been sent.</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-md bg-accent hover:bg-accent-dark text-white text-[13.5px] font-bold disabled:opacity-60 shadow-sm transition-colors"
              >
                {loading ? 'Verifying…' : 'Verify and create account'}
              </button>

              <div className="flex items-center justify-between text-[12.5px]">
                <button type="button" onClick={() => setStep('details')} className="text-muted hover:text-ink">
                  Change details
                </button>
                <button type="button" onClick={handleResend} className="text-accent font-medium hover:text-accent-dark">
                  Resend code
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-[12.5px] text-muted text-center">
            Already have an account?{' '}
            <Link href={`/store/${subdomain}/account/login`} className="text-accent font-medium hover:text-accent-dark">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
