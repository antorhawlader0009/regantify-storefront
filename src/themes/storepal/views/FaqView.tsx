import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { FaqList } from '../components/FaqList';
import { useStoreText } from '../lib/storeText';

/** /faq: the store's questions and answers (TellMe idea 122). */
export function FaqView({ subdomain, storeName, categories, items }: { subdomain: string; storeName: string; categories: string[]; items: Array<{ id: string; question: string; answer: string }> }) {
  const t = useStoreText();
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={categories} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="mb-1 text-center text-[28px] font-bold">{t('FAQ')}</h1>
        <p className="mb-8 text-center text-[13px] text-muted">{t('Questions our customers ask most')}</p>
        {items.length === 0 ? <p className="text-center text-[14px] text-muted">{t('No questions yet.')}</p> : <FaqList items={items} />}
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
