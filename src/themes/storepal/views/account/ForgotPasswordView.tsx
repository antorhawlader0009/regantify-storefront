'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { forgotPasswordSendOtp, forgotPasswordVerifyOtp, resetPassword } from '@/lib/customerAuthApi';
import { StoreHeader } from '../../components/StoreHeader';
import { StoreFooter } from '../../components/StoreFooter';
import { useStoreDisplayName } from '../../lib/useStoreDisplayName';

type Step = 'email' | 'otp' | 'reset' | 'done';

/**
 * Matches the reference "Change Password" screenshot (the logged-out,
 * forgot-password version — email only) — 3 steps: send code to email,
 * verify it, then set a new password. See
 * CustomerAuthService.forgotPasswordSendOtp/verifyOtp/resetPassword.
 */
export function ForgotPasswordView({ subdomain }: { subdomain: string }) {
  const router = useRouter();
  const storeName = useStoreDisplayName(subdomain);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await forgotPasswordSendOtp(email.trim());
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code.trim()) {
      setError('Enter the code sent to your email.');
      return;
    }
    setLoading(true);
    try {
      const result = await forgotPasswordVerifyOtp(email.trim(), code.trim());
      setResetToken(result.resetToken);
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify that code.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(resetToken, newPassword);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={[]} />

      <main className="max-w-md mx-auto px-4 sm:px-6 py-12 flex-1 w-full">
        <div className="bg-surface border border-line rounded-lg p-6 sm:p-7">
          <h1 className="text-[24px] font-bold text-ink mb-5">Change Password</h1>

          {step === 'email' && (
            <form onSubmit={handleSend} className="space-y-3.5">
              <div>
                <label className="block text-[13px] font-medium text-ink mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.slice(0, 150))}
                  autoFocus
                  maxLength={150}
                  className="w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-surface text-[13.5px] outline-none focus:border-ink transition-colors"
                />
              </div>
              {error && <p className="text-[12.5px] text-accent">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-md bg-ink hover:bg-ink/90 text-white text-[13.5px] font-bold disabled:opacity-60 transition-colors"
              >
                {loading ? 'Sending…' : 'Send'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerify} className="space-y-3.5">
              <p className="text-[13px] text-muted">If an account exists for {email}, a code has been sent.</p>
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
                {loading ? 'Verifying…' : 'Verify'}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleReset} className="space-y-3.5">
              <div>
                <label className="block text-[13px] font-medium text-ink mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value.slice(0, 72))}
                  autoFocus
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
                {loading ? 'Saving…' : 'Change Password'}
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="space-y-4">
              <p className="text-[13.5px] text-ink">Your password has been reset. You can now log in with your new password.</p>
              <button
                onClick={() => router.push(`/store/${subdomain}/account/login`)}
                className="w-full py-3 rounded-md bg-ink hover:bg-ink/90 text-white text-[13.5px] font-bold transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </main>

      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
