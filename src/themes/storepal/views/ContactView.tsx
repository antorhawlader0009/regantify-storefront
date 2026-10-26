'use client';

import { useState } from 'react';
import { MapPin, MessageCircle, Phone } from 'lucide-react';
import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { useStoreText } from '../lib/storeText';
import { sendContactMessage, type StoreContactPage } from '@/lib/storefrontApi';
import { phoneInput } from '@/lib/phoneInput';
import { trackFeature } from '@/lib/featureUse';

const inputCls = 'mt-2 w-full border border-line bg-white px-4 py-3 text-[14px] font-normal text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none';
const labelCls = 'block text-[12px] font-semibold uppercase tracking-wide text-ink';

/** /contact: a message form for shoppers (no account) and the store's WhatsApp, phone and address cards. The store reads it in Customers > Messages. */
export function ContactView({ subdomain, storeName, categories, page }: { subdomain: string; storeName: string; categories: string[]; page: StoreContactPage }) {
  const t = useStoreText();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await sendContactMessage(subdomain, { name: name.trim(), phone: phone.trim(), email: email.trim() || undefined, message: message.trim() });
      setDone(true);
      trackFeature('CONTACT_SENT');
      setMessage('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const cards = [
    page.whatsapp && { icon: MessageCircle, label: t('WhatsApp, fastest reply'), value: page.whatsapp.label, href: page.whatsapp.url, external: true },
    page.phone && { icon: Phone, label: t('Call us'), value: page.phone.label, href: page.phone.url, external: false },
    page.basedIn && { icon: MapPin, label: t('Based in'), value: page.basedIn, href: null, external: false },
  ].filter(Boolean) as Array<{ icon: typeof Phone; label: string; value: string; href: string | null; external: boolean }>;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={categories} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="mb-1 text-center text-[28px] font-bold">{t('Contact us')}</h1>
        <p className="mb-8 text-center text-[13px] text-muted">{page.intro || t('Have a question? Write to us and we will get back to you.')}</p>
        <div className={`grid gap-6 ${cards.length > 0 ? 'lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-12' : 'mx-auto max-w-2xl'}`}>
          <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
            {done ? (
              <div className="py-10 text-center">
                <p className="text-[16px] font-semibold">{t('Thank you. We got your message.')}</p>
                <p className="mt-1 text-[13px] text-muted">{t('We will get back to you soon.')}</p>
                <button type="button" onClick={() => setDone(false)} className="mt-5 text-[13px] font-medium text-accent hover:text-accent-dark">
                  {t('Send another message')}
                </button>
              </div>
            ) : !page.enabled ? (
              <p className="py-10 text-center text-[14px] text-muted">This store is not taking messages here right now. Please use the contact details.</p>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className={labelCls}>
                    {t('Your name')}
                    <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" className={inputCls} />
                  </label>
                  <label className={labelCls}>
                    {t('Mobile number')}
                    <input value={phone} onChange={(e) => setPhone(phoneInput(e.target.value))} required inputMode="tel" maxLength={16} placeholder="01XXXXXXXXX" autoComplete="tel" className={inputCls} />
                  </label>
                </div>
                <label className={labelCls}>
                  {t('Email')} <span className="text-[10px] font-normal normal-case tracking-normal text-muted">{t('(optional)')}</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} autoComplete="email" className={inputCls} />
                </label>
                <label className={labelCls}>
                  {t('Message')}
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    minLength={5}
                    maxLength={2000}
                    rows={6}
                    placeholder={t("Include your order number if it's about an order")}
                    className={inputCls}
                  />
                </label>
                {error && <p className="text-[13px] text-red-600">{error}</p>}
                <button type="submit" disabled={busy} className="bg-ink px-7 py-3.5 text-[13px] font-semibold uppercase tracking-wide text-white disabled:opacity-60">
                  {busy ? t('Sending…') : t('Send message')}
                </button>
              </form>
            )}
          </div>
          {cards.length > 0 && (
            <div className="space-y-3">
              {cards.map((c) => {
                const Icon = c.icon;
                const inner = (
                  <>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-accent">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12px] uppercase tracking-wide text-muted">{c.label}</span>
                      <span className="block break-words text-[15px] font-semibold text-ink">{c.value}</span>
                    </span>
                  </>
                );
                const cls = 'flex items-center gap-4 rounded-lg bg-accent/10 px-4 py-4';
                return c.href ? (
                  <a key={c.label} href={c.href} {...(c.external && { target: '_blank', rel: 'noopener noreferrer' })} className={`${cls} transition-colors hover:bg-accent/15`}>
                    {inner}
                  </a>
                ) : (
                  <div key={c.label} className={cls}>
                    {inner}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
