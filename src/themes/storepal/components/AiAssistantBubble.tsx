'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { prefetchChatStatus } from '@/lib/chatApi';
import { trackFeature } from '@/lib/featureUse';
import { useHeaderPresence } from '../lib/headerPresence';
import { rememberOpen } from '../lib/chatHistory';
import { useCartDrawer } from '../lib/cartDrawer';
import { floatingHideTransform, useFloatingHidden } from '../lib/floatingScroll';
import { FLOATING_BUTTON, useAssistantBottom } from '../lib/floatingStack';

/**
 * The chat bubble alone, shown while the full chat widget's file (AiAssistantWidget.tsx, large: voice call, photos,
 * order card) is still loading, so the bubble appears with the page instead of seconds later. Same look and place as
 * the widget's own bubble. It shows from this store's last known answer in this browser, else once the status call
 * (started here, shared with the widget) says yes. A tap before the widget is ready is remembered (the widget opens
 * itself on load, through chatHistory's per-tab open flag).
 */
export function AiAssistantBubble({ subdomain }: { subdomain: string }) {
  const [available, setAvailable] = useState(false);
  const [pressed, setPressed] = useState(false);
  const headerHere = useHeaderPresence((s) => s.count > 0);
  const cartOpen = useCartDrawer((s) => s.open);
  const { hidden: scrolledAway, reveal } = useFloatingHidden(cartOpen);
  const assistantBottom = useAssistantBottom();

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `storepal-chat-on:${subdomain}`;
    try {
      if (localStorage.getItem(cacheKey) === '1') setAvailable(true);
    } catch {
      /* storage blocked: wait for the server */
    }
    void prefetchChatStatus(subdomain).then((status) => {
      if (!cancelled) setAvailable(status.available);
    });
    return () => {
      cancelled = true;
    };
  }, [subdomain]);

  if (!available || !headerHere || pressed) return null;
  return (
    <button
      onClick={() => {
        rememberOpen(subdomain, true);
        trackFeature('AI_CHAT_OPEN', { oncePerSession: true });
        setPressed(true);
      }}
      aria-label="Chat with our assistant"
      title="শপিং সহকারীর সাথে কথা বলুন"
      className={`fixed ${assistantBottom} right-5 z-30 ${FLOATING_BUTTON} bg-accent hover:bg-accent-dark text-white flex items-center justify-center transition-[transform,background-color] duration-300 ease-out motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
      onFocus={reveal}
      style={{
        transform: cartOpen ? 'translateX(calc(-100vw + 5.5rem))' : scrolledAway ? floatingHideTransform('right') : undefined,
      }}
    >
      <MessageCircle size={26} strokeWidth={2.2} />
    </button>
  );
}
