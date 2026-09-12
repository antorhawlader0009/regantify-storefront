'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { changeMyPassword } from '@/lib/customerAuthApi';
import { useCustomerAuthStore, useCustomerAuthHydrated } from '@/providers/customer-auth-store-provider';
import { AccountLayout } from '../../components/AccountLayout';
import { useStoreDisplayName } from '../../lib/useStoreDisplayName';

/** Account > Change Password (already logged in) — matches the reference sidebar-layout screenshot. */
export function ChangePasswordView({ subdomain }: { subdomain: string }) {
  const storeName = useStoreDisplayName(subdomain);
  const hydrated = useCustomerAuthHydrated();
  const customer = useCustomerAuthStore((s) => s.customer);
  const accessToken = useCustomerAuthStore((s) => s.accessToken);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!currentPassword.trim() || newPassword.length < 6) {
      setError('Enter your current password and a new password of at least 6 characters.');
      return;
    }
    if (!accessToken) return;
    setSaving(true);
    try {
      await changeMyPassword(accessToken, currentPassword.trim(), newPassword);
      setSaved(true);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change your password.');
    } finally {
      setSaving(false);
    }
  };

  if (hydrated && !customer) {
    return (
      <AccountLayout subdomain={subdomain} storeName={storeName}>
        <div className="bg-surface border border-line rounded-lg p-6 text-center">
          <User size={26} className="mx-auto text-muted mb-3" />
          <p className="text-[14px] text-ink font-semibold mb-1">Log in to change your password</p>
          <Link
            href={`/store/${subdomain}/account/login`}
            className="inline-block mt-3 px-5 py-2.5 rounded-md bg-ink hover:bg-ink/90 text-white text-[13px] font-bold transition-colors"
          >
            Log in
          </Link>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout subdomain={subdomain} storeName={storeName}>
      <h1 className="text-[22px] font-bold text-ink mb-5">Change Password</h1>
      <div className="bg-surface border border-line rounded-lg p-5 sm:p-6 max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value.slice(0, 72))}
              maxLength={72}
              className="w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-canvas text-[13.5px] outline-none focus:border-ink transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value.slice(0, 72))}
              maxLength={72}
              className="w-full px-3.5 py-2.5 rounded-md border border-line-strong bg-canvas text-[13.5px] outline-none focus:border-ink transition-colors"
            />
          </div>

          {error && <p className="text-[12.5px] text-accent">{error}</p>}
          {saved && <p className="text-[12.5px] text-success">Password changed successfully.</p>}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-md bg-ink hover:bg-ink/90 text-white text-[13.5px] font-bold disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving…' : 'Change Password'}
          </button>
        </form>
      </div>
    </AccountLayout>
  );
}
