'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { FaqList } from './FaqList';
import { useStoreText } from '../lib/storeText';

/** The home page's FAQ section (TellMe idea 122): the first 5 questions and a link to all of them. Nothing until the store has a question switched on. */
export function FaqSection({ subdomain, items }: { subdomain: string; items: Array<{ id: string; question: string; answer: string }> }) {
  const t = useStoreText();
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-3xl">
      <h2 className="mb-4 text-center text-[20px] font-bold text-ink">{t('FAQ')}</h2>
      <FaqList items={items.slice(0, 5)} />
      {items.length > 5 && (
        <div className="mt-3 text-center">
          <Link href={`/store/${subdomain}/faq`} className="inline-flex items-center gap-0.5 text-[13px] font-medium text-accent hover:text-accent-dark">
            {t('All questions')}
            <ChevronRight size={15} aria-hidden />
          </Link>
        </div>
      )}
    </section>
  );
}
