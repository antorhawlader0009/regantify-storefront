'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { customerSignup, resendSignupOtp, verifyCustomerSignup } from '@/lib/customerAuthApi';
import { useCustomerAuthStore } from '@/providers/customer-auth-store-provider';

type Step = 'details' | 'otp';

export function SignupView({ subdomain }: { subdomain: string }) {
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
      <header className="border-b border-line">
        <div className="max-w-sm mx-auto px-5 sm:px-8 py-5">
          <Link href={`/store/${subdomain}`} className="inline-flex items-center gap-1.5 text-[13px] text-ink hover:text-accent transition-colors">
            <ArrowLeft size={14} strokeWidth={1.5} />
            Back to store
          </Link>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-5 sm:px-8 py-14">
        <h1 className="font-display italic text-[24px] text-ink mb-1.5">Create your account</h1>
        <p className="text-[13px] text-muted mb-8">
          {step === 'details'
            ? 'Sign up to track your orders and check out faster next time.'
            : `Enter the 6-digit code we sent to ${phone}.`}
        </p>

        {step === 'details' ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              className="w-full px-0 py-2.5 bg-transparent border-b border-line text-[13.5px] outline-none transition-colors focus:border-ink placeholder:text-muted"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number (e.g. 017XXXXXXXX)"
              className="w-full px-0 py-2.5 bg-transparent border-b border-line text-[13.5px] outline-none transition-colors focus:border-ink placeholder:text-muted"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              className="w-full px-0 py-2.5 bg-transparent border-b border-line text-[13.5px] outline-none transition-colors focus:border-ink placeholder:text-muted"
            />

            {error && <p className="text-[12px] text-accent-dark">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-ink hover:bg-accent-dark text-white text-[12.5px] tracking-[0.04em] uppercase disabled:opacity-60 transition-colors"
            >
              {loading ? 'Sending code…' : 'Send verification code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-5">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="6-digit code"
              autoFocus
              className="w-full px-0 py-2.5 bg-transparent border-b border-line text-[16px] tracking-[0.3em] text-center outline-none transition-colors focus:border-ink placeholder:text-muted"
            />

            {error && <p className="text-[12px] text-accent-dark">{error}</p>}
            {resent && <p className="text-[12px] text-success">A new code has been sent.</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-ink hover:bg-accent-dark text-white text-[12.5px] tracking-[0.04em] uppercase disabled:opacity-60 transition-colors"
            >
              {loading ? 'Verifying…' : 'Verify and create account'}
            </button>

            <div className="flex items-center justify-between text-[12.5px]">
              <button type="button" onClick={() => setStep('details')} className="text-muted hover:text-ink transition-colors">
                Change details
              </button>
              <button type="button" onClick={handleResend} className="text-ink border-b border-ink pb-0.5">
                Resend code
              </button>
            </div>
          </form>
        )}

        <p className="mt-8 text-[12.5px] text-muted text-center">
          Already have an account?{' '}
          <Link href={`/store/${subdomain}/account/login`} className="text-ink border-b border-ink pb-0.5">
            Log in
          </Link>
        </p>
      </main>
    </div>
  );
}
