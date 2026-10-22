'use client';

import { Bot } from 'lucide-react';
import { searchQuestion, useAssistantBridge } from '../lib/assistantBridge';
import { useStoreText } from '../lib/storeText';

/**
 * "Ask our assistant" for a search that found nothing: opens the AI chat and sends the search words
 * (lib/assistantBridge.ts). Renders nothing while the store's assistant is not available.
 */
export function AskAssistantButton({ words, className, onAsk }: { words: string; className?: string; onAsk?: () => void }) {
  const t = useStoreText();
  const available = useAssistantBridge((s) => s.available);
  const ask = useAssistantBridge((s) => s.ask);
  if (!available || !words.trim()) return null;
  return (
    <button
      type="button"
      onClick={() => {
        onAsk?.();
        ask(searchQuestion(words));
      }}
      className={
        className ??
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-[13.5px] font-medium hover:bg-accent-dark transition-colors'
      }
    >
      <Bot size={16} />
      <span className="truncate">
        {t('Ask our assistant about')} “{words.trim()}”
      </span>
    </button>
  );
}
