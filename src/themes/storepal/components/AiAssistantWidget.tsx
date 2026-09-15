'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { sendChatMessage, type ChatTurn, type ChatProductRef } from '@/lib/chatApi';
import { formatPrice } from '../lib/formatPrice';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  products?: ChatProductRef[];
}

const GREETING: Message = {
  role: 'assistant',
  content: "Hi! I'm your shopping assistant. Ask me about any product — sizes, prices, or what's in stock.",
};

/**
 * Floating "Assistant" icon (Store AI Chat Bot — see Super Admin > AI
 * Settings, which picks the Workers AI model this actually calls) —
 * stacked directly above the WhatsApp bubble at the same corner, same
 * convention as a typical storefront's "help" widgets clustering in one
 * spot rather than spreading floating buttons across the screen.
 * Renders unconditionally (unlike WhatsAppBubble, which needs a vendor-
 * set link) since the chat endpoint works for every store — see
 * StorefrontController.chat.
 */
export function AiAssistantWidget({ subdomain }: { subdomain: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    const history: ChatTurn[] = messages
      .filter((m) => m !== GREETING)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setDraft('');
    setSending(true);
    try {
      const res = await sendChatMessage(subdomain, text, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply, products: res.products }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: err instanceof Error ? err.message : 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close assistant' : 'Chat with our assistant'}
        className="fixed bottom-[76px] right-5 z-30 w-12 h-12 rounded-full bg-accent hover:bg-accent-dark shadow-lg flex items-center justify-center transition-colors"
      >
        {open ? <X size={22} className="text-white" /> : <Bot size={24} className="text-white" />}
      </button>

      {open && (
        <div className="fixed bottom-[136px] right-5 z-30 w-[min(360px,calc(100vw-2.5rem))] h-[min(480px,calc(100vh-180px))] bg-surface rounded-xl border border-line shadow-xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-line bg-ink text-white shrink-0">
            <Bot size={18} />
            <span className="text-[13.5px] font-semibold">Store Assistant</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
                    m.role === 'user' ? 'bg-ink text-white' : 'bg-canvas text-ink border border-line'
                  }`}
                >
                  {m.content}
                </div>

                {m.products && m.products.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1.5 w-full max-w-[85%]">
                    {m.products.map((p) => (
                      <Link
                        key={p.slug}
                        href={`/store/${subdomain}/product/${p.slug}`}
                        className="flex items-center gap-2.5 rounded-lg border border-line bg-surface p-2 hover:border-accent transition-colors"
                      >
                        <span className="relative w-10 h-10 shrink-0 rounded overflow-hidden bg-canvas">
                          {p.photoUrl && <Image src={p.photoUrl} alt={p.name} fill sizes="40px" className="object-cover" />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[12px] font-medium text-ink truncate">{p.name}</span>
                          <span className="block text-[12px] font-bold text-accent">{formatPrice(p.price)}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-1.5 text-muted text-[12.5px]">
                <Loader2 size={13} className="animate-spin" />
                Thinking…
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-line p-2.5 shrink-0">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about a product…"
              disabled={sending}
              className="flex-1 px-3 py-2 rounded-lg border border-line-strong text-[13px] text-ink bg-surface outline-none focus:border-accent transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              aria-label="Send"
              className="w-9 h-9 shrink-0 rounded-lg bg-ink text-white flex items-center justify-center disabled:opacity-40 hover:bg-ink/90 transition-colors"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
