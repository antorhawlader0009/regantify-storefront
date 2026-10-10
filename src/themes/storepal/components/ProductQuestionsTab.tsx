'use client';

import { useState } from 'react';
import { askProductQuestion, type ProductQuestion } from '@/lib/questionsApi';
import { useStoreText } from '../lib/storeText';

/**
 * The "Questions" tab on a StorePal product page (TellMe idea 35): the questions the store has answered, and a form to
 * ask a new one. A new question is not shown until the store answers it, and the shopper is told so. The list is loaded
 * by the parent tabs (so the tab can show its count); no account or email is asked, only a name.
 */
export function ProductQuestionsTab({
  subdomain,
  slug,
  questions,
  error,
}: {
  subdomain: string;
  slug: string;
  /** null while loading. */
  questions: ProductQuestion[] | null;
  error: string | null;
}) {
  const t = useStoreText();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setProblem(null);
    if (name.trim().length < 2 || question.trim().length < 8) {
      setProblem(t('Please enter your name and your question.'));
      return;
    }
    setSending(true);
    try {
      await askProductQuestion(subdomain, slug, { customerName: name.trim(), question: question.trim() });
      setSent(true);
      setOpen(false);
      setQuestion('');
    } catch (err) {
      setProblem(err instanceof Error ? err.message : t('Could not send your question. Please try again.'));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-2xl">
      {error && <p className="text-[13px] text-accent mb-4">{error}</p>}
      {!error && questions === null && <p className="text-[13px] text-muted mb-4">{t('Loading questions…')}</p>}
      {questions && questions.length === 0 && <p className="text-[13px] text-muted mb-4">{t('No questions yet. Ask the first one.')}</p>}

      {questions && questions.length > 0 && (
        <div className="flex flex-col gap-4 mb-6">
          {questions.map((q) => (
            <div key={q.id} className="border-b border-line pb-4 last:border-0">
              <p className="text-[13.5px] font-semibold text-ink whitespace-pre-line">{q.question}</p>
              <p className="mt-0.5 text-[12px] text-muted">{q.customerName}</p>
              <div className="mt-2 rounded-md border-l-2 border-accent bg-canvas px-3 py-2">
                <p className="m-0 text-[11.5px] font-bold text-ink">{t('Answer from the store')}</p>
                <p className="m-0 mt-0.5 text-[13px] text-ink/85 leading-relaxed whitespace-pre-line">{q.answer}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {sent ? (
        <div className="bg-canvas border border-line rounded-lg p-4 text-[13px] text-ink">
          {t('Thanks! Your question was sent. It will appear here once the store answers it.')}
        </div>
      ) : !open ? (
        <button onClick={() => setOpen(true)} className="px-4 py-2 rounded-md border border-line text-[12.5px] font-semibold text-ink hover:border-ink transition-colors">
          {t('Ask a question')}
        </button>
      ) : (
        <form onSubmit={submit} className="border border-line rounded-lg p-4 space-y-3">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value.slice(0, 500))}
            placeholder={t('Your question about this product')}
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-md text-[13px] bg-canvas border border-line outline-none resize-y font-[inherit] transition-colors focus:border-ink focus:bg-surface"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            placeholder={t('Your name')}
            className="w-full px-3.5 py-2.5 rounded-md text-[13px] bg-canvas border border-line outline-none transition-colors focus:border-ink focus:bg-surface"
          />
          {problem && <p className="text-[12px] text-accent">{problem}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={sending} className="px-4 py-2 rounded-md bg-accent hover:bg-accent-dark text-white text-[12.5px] font-bold disabled:opacity-60 shadow-sm transition-colors">
              {sending ? t('Sending…') : t('Send question')}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-md text-[12.5px] font-semibold text-muted hover:text-ink transition-colors">
              {t('Cancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
