'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import {
  customerLogin,
  customerSignup,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  resendSignupOtp,
  resetPassword,
  verifyCustomerSignup,
} from '@/lib/customerAuthApi';
import { useCustomerAuthStore } from '@/providers/customer-auth-store-provider';
import { trackMetaCompleteRegistration } from '@/lib/metaPixelEvents';
import { trackSignUp } from '@/lib/ecommerceEvents';
import { useAuthDialog, type AuthDialogMode } from '../lib/authDialog';

const RESEND_SECONDS = 30;

const INPUT_CLASS =
  'h-11 w-full rounded-lg border border-line-strong bg-surface px-3.5 text-[14px] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-ink focus-visible:ring-2 focus-visible:ring-accent/30';
const PRIMARY_BUTTON_CLASS =
  'flex h-12 w-full items-center justify-center rounded-lg bg-accent text-[14.5px] font-bold text-white shadow-sm transition-colors hover:bg-accent-dark disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

function Field({ label, hint, children, id }: { label: string; hint?: React.ReactNode; children: React.ReactNode; id: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-ink">
          {label}
        </label>
        {hint}
      </div>
      {children}
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 72))}
        maxLength={72}
        autoComplete={autoComplete}
        className={`${INPUT_CLASS} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function ErrorLine({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md bg-accent/10 px-3 py-2 text-[12.5px] font-medium text-accent">
      {message}
    </p>
  );
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const uid = useId();
  const setSession = useCustomerAuthStore((s) => s.setSession);
  const setMode = useAuthDialog((s) => s.setMode);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password.trim()) {
      setError('Enter your email or phone number and your password.');
      return;
    }
    setLoading(true);
    try {
      const result = await customerLogin(identifier.trim(), password);
      setSession(result.customer, result.accessToken);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email or phone number" id={`${uid}-id`}>
        <input
          id={`${uid}-id`}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value.slice(0, 150))}
          autoFocus
          maxLength={150}
          autoComplete="username"
          className={INPUT_CLASS}
        />
      </Field>
      <Field
        label="Password"
        id={`${uid}-pw`}
        hint={
          <button
            type="button"
            onClick={() => setMode('forgot')}
            className="text-[12.5px] font-medium text-accent hover:text-accent-dark"
          >
            Forgot password?
          </button>
        }
      >
        <PasswordInput id={`${uid}-pw`} value={password} onChange={setPassword} autoComplete="current-password" />
      </Field>
      <ErrorLine message={error} />
      <button type="submit" disabled={loading} className={PRIMARY_BUTTON_CLASS}>
        {loading ? 'Logging in…' : 'Log in'}
      </button>
      <p className="text-center text-[13px] text-muted">
        New here?{' '}
        <button type="button" onClick={() => setMode('signup')} className="font-semibold text-accent hover:text-accent-dark">
          Create an account
        </button>
      </p>
    </form>
  );
}

function SignupForm({ subdomain, onDone }: { subdomain: string; onDone: () => void }) {
  const uid = useId();
  const setSession = useCustomerAuthStore((s) => s.setSession);
  const setMode = useAuthDialog((s) => s.setMode);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !phone.trim() || !password.trim()) {
      setError('Enter your name, phone number and a password.');
      return;
    }
    setLoading(true);
    try {
      await customerSignup(phone.trim(), fullName.trim(), password, email.trim() || undefined, subdomain);
      setStep('otp');
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.trim().length < 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const result = await verifyCustomerSignup(phone.trim(), code.trim());
      setSession(result.customer, result.accessToken);
      trackMetaCompleteRegistration();
      trackSignUp();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify your code.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await resendSignupOtp(phone.trim(), fullName.trim(), password, email.trim() || undefined, subdomain);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send a new code.');
    }
  };

  if (step === 'otp') {
    return (
      <form onSubmit={verify} className="space-y-4">
        <Field label="6-digit code" id={`${uid}-code`}>
          <input
            id={`${uid}-code`}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className={`${INPUT_CLASS} text-center text-[18px] font-semibold tracking-[0.4em]`}
          />
        </Field>
        <ErrorLine message={error} />
        <button type="submit" disabled={loading} className={PRIMARY_BUTTON_CLASS}>
          {loading ? 'Verifying…' : 'Verify and continue'}
        </button>
        <div className="flex items-center justify-between text-[13px]">
          <button type="button" onClick={() => { setStep('form'); setCode(''); setError(null); }} className="font-medium text-muted hover:text-ink">
            Change number
          </button>
          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0}
            className="font-semibold text-accent hover:text-accent-dark disabled:text-muted disabled:hover:text-muted"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={createAccount} className="space-y-4">
      <Field label="Name" id={`${uid}-name`}>
        <input
          id={`${uid}-name`}
          value={fullName}
          onChange={(e) => setFullName(e.target.value.slice(0, 100))}
          autoFocus
          maxLength={100}
          autoComplete="name"
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="Phone number" id={`${uid}-phone`}>
        <input
          id={`${uid}-phone`}
          value={phone}
          onChange={(e) => setPhone(e.target.value.slice(0, 30))}
          placeholder="01XXXXXXXXX"
          inputMode="tel"
          autoComplete="tel"
          maxLength={30}
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="Email (optional)" id={`${uid}-email`}>
        <input
          id={`${uid}-email`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value.slice(0, 150))}
          maxLength={150}
          autoComplete="email"
          className={INPUT_CLASS}
        />
      </Field>
      <Field label="Password" id={`${uid}-pw`}>
        <PasswordInput id={`${uid}-pw`} value={password} onChange={setPassword} autoComplete="new-password" />
      </Field>
      <ErrorLine message={error} />
      <button type="submit" disabled={loading} className={PRIMARY_BUTTON_CLASS}>
        {loading ? 'Creating account…' : 'Create account'}
      </button>
      <p className="text-center text-[13px] text-muted">
        Already have an account?{' '}
        <button type="button" onClick={() => setMode('login')} className="font-semibold text-accent hover:text-accent-dark">
          Log in
        </button>
      </p>
    </form>
  );
}

type ForgotStep = 'phone' | 'otp' | 'reset' | 'done';

/** Forgot password: text a code to the account's phone, check it, set a new password, then back to Log in (CustomerAuthService.forgotPassword*). */
function ForgotForm({ subdomain }: { subdomain: string }) {
  const uid = useId();
  const setMode = useAuthDialog((s) => s.setMode);
  const [step, setStep] = useState<ForgotStep>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone.trim()) {
      setError('Enter your phone number.');
      return;
    }
    setLoading(true);
    try {
      await forgotPasswordSendOtp(phone.trim(), subdomain);
      setStep('otp');
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await forgotPasswordSendOtp(phone.trim(), subdomain);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send a new code.');
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.trim().length < 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const result = await forgotPasswordVerifyOtp(phone.trim(), code.trim());
      setResetToken(result.resetToken);
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify that code.');
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
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

  if (step === 'done') {
    return (
      <div className="space-y-4">
        <p className="rounded-md bg-success-bg px-3 py-2.5 text-[13.5px] font-medium text-success">
          Your password has been changed. Log in with the new one.
        </p>
        <button type="button" onClick={() => setMode('login')} className={PRIMARY_BUTTON_CLASS}>
          Log in
        </button>
      </div>
    );
  }

  if (step === 'reset') {
    return (
      <form onSubmit={reset} className="space-y-4">
        <Field label="New password" id={`${uid}-new`}>
          <PasswordInput id={`${uid}-new`} value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
        </Field>
        <ErrorLine message={error} />
        <button type="submit" disabled={loading} className={PRIMARY_BUTTON_CLASS}>
          {loading ? 'Saving…' : 'Change password'}
        </button>
      </form>
    );
  }

  if (step === 'otp') {
    return (
      <form onSubmit={verify} className="space-y-4">
        <p className="text-[13px] text-muted">We sent a 6-digit code by SMS to {phone.trim()}.</p>
        <Field label="6-digit code" id={`${uid}-code`}>
          <input
            id={`${uid}-code`}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className={`${INPUT_CLASS} text-center text-[18px] font-semibold tracking-[0.4em]`}
          />
        </Field>
        <ErrorLine message={error} />
        <button type="submit" disabled={loading} className={PRIMARY_BUTTON_CLASS}>
          {loading ? 'Verifying…' : 'Verify code'}
        </button>
        <div className="flex items-center justify-between text-[13px]">
          <button type="button" onClick={() => { setStep('phone'); setCode(''); setError(null); }} className="font-medium text-muted hover:text-ink">
            Change number
          </button>
          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0}
            className="font-semibold text-accent hover:text-accent-dark disabled:text-muted disabled:hover:text-muted"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="space-y-4">
      <Field label="Phone number" id={`${uid}-phone`}>
        <input
          id={`${uid}-phone`}
          value={phone}
          onChange={(e) => setPhone(e.target.value.slice(0, 30))}
          placeholder="01XXXXXXXXX"
          autoFocus
          inputMode="tel"
          autoComplete="tel"
          maxLength={30}
          className={INPUT_CLASS}
        />
      </Field>
      <ErrorLine message={error} />
      <button type="submit" disabled={loading} className={PRIMARY_BUTTON_CLASS}>
        {loading ? 'Sending…' : 'Send code'}
      </button>
      <p className="text-center text-[13px] text-muted">
        Remembered it?{' '}
        <button type="button" onClick={() => setMode('login')} className="font-semibold text-accent hover:text-accent-dark">
          Back to log in
        </button>
      </p>
    </form>
  );
}

const COPY: Record<AuthDialogMode, { title: string; subtitle: string }> = {
  login: { title: 'Log in', subtitle: 'See your orders and check out faster.' },
  signup: { title: 'Create your account', subtitle: 'Track orders and save your address for next time.' },
  forgot: { title: 'Reset your password', subtitle: 'We will text a code to your phone so you can set a new one.' },
};

function AuthDialogPanel({ subdomain }: { subdomain: string }) {
  const mode = useAuthDialog((s) => s.mode);
  const close = useAuthDialog((s) => s.close);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [shown, setShown] = useState(false);

  // Fade/scale in on the frame after mounting.
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Esc closes, Tab stays inside the dialog, the page behind doesn't scroll, focus goes back on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [close]);

  const copy = COPY[mode];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 motion-reduce:transition-none ${shown ? 'opacity-100' : 'opacity-0'}`}
        onClick={close}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative max-h-[calc(100vh-2rem)] w-full max-w-[420px] overflow-y-auto rounded-2xl bg-canvas p-6 shadow-2xl transition-all duration-200 ease-out motion-reduce:transition-none sm:p-8 ${shown ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-95 opacity-0'}`}
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full p-2 text-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <X size={18} />
        </button>
        <h2 id={titleId} className="pr-8 text-[22px] font-bold leading-tight text-ink">
          {copy.title}
        </h2>
        <p className="mb-5 mt-1 text-[13.5px] text-muted">{copy.subtitle}</p>
        {mode === 'login' && <LoginForm onDone={close} />}
        {mode === 'signup' && <SignupForm subdomain={subdomain} onDone={close} />}
        {mode === 'forgot' && <ForgotForm subdomain={subdomain} />}
      </div>
    </div>
  );
}

/**
 * StorePal's login and sign-up, as one pop-up dialog instead of separate pages.
 * Log in is email or phone plus password (no OTP login); Create account still
 * verifies the phone with a code, because the server requires it. A successful
 * login or sign-up just closes the dialog, so the shopper stays on the page they
 * were on (their cart, the checkout...). Content mounts only while open, so each
 * opening starts with empty fields.
 */
export function AuthDialog({ subdomain }: { subdomain: string }) {
  const open = useAuthDialog((s) => s.open);
  if (!open) return null;
  return <AuthDialogPanel subdomain={subdomain} />;
}
