'use client';

import { useEffect } from 'react';
import type { StorefrontCustomCode } from '@/lib/storefrontApi';

// Stores whose code already ran in this page load. The store layout stays
// mounted across client-side navigation, but StrictMode double-runs
// effects in dev and a script must never run twice.
const injectedStores = new Set<string>();

/**
 * Store > Design > Custom Head Scripts / JavaScript Code, StorePal only
 * (Custom CSS is a plain SSR <style> in the store layout instead). Runs
 * once per full page load, after hydration, so vendor code that touches
 * the DOM sees the rendered page and can't trip React's hydration.
 *
 * Order: the head snippet, then HEAD scripts (both into <head>), then
 * BODY scripts (end of <body>). The head snippet is HTML when it starts
 * with a tag, otherwise plain JavaScript (vendors paste both). Scripts
 * parsed out of HTML never run when inserted via innerHTML, so each one is
 * rebuilt as a fresh element. An external <script src> without
 * async/defer is awaited before the next node, so e.g. a library tag
 * followed by inline code using it still works.
 */
export function CustomCodeInjector({ subdomain, code }: { subdomain: string; code: StorefrontCustomCode }) {
  useEffect(() => {
    if (injectedStores.has(subdomain)) return;
    injectedStores.add(subdomain);

    void (async () => {
      const head = code.headScripts?.trim();
      if (head) {
        if (head.startsWith('<')) await injectHtml(head, document.head);
        else injectInlineScript(head, document.head, 'head');
      }
      for (const s of code.headJs) injectInlineScript(s.code, document.head, s.id);
      for (const s of code.bodyJs) injectInlineScript(s.code, document.body, s.id);
    })();
    // Runs once per store per page load by design; see injectedStores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdomain]);

  return null;
}

async function injectHtml(html: string, target: HTMLElement) {
  const template = document.createElement('template');
  template.innerHTML = html;
  for (const node of Array.from(template.content.childNodes)) {
    if (node instanceof HTMLScriptElement) {
      await injectScriptElement(node, target);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      safeAppend(target, document.importNode(node, true));
    }
    // Whitespace/text/comment nodes between tags are dropped.
  }
}

function injectScriptElement(source: HTMLScriptElement, target: HTMLElement): Promise<void> {
  const script = document.createElement('script');
  for (const attr of Array.from(source.attributes)) script.setAttribute(attr.name, attr.value);
  script.setAttribute('data-store-custom', 'head');
  const blocking = !!script.src && !source.hasAttribute('async') && !source.hasAttribute('defer');
  if (!script.src) script.text = source.text;
  if (!blocking) {
    safeAppend(target, script);
    return Promise.resolve();
  }
  // Dynamic scripts are async by default; wait so the next tag runs in order.
  return new Promise((resolve) => {
    script.onload = () => resolve();
    script.onerror = () => resolve();
    if (!safeAppend(target, script)) resolve();
  });
}

function injectInlineScript(code: string, target: HTMLElement, id: string) {
  const script = document.createElement('script');
  script.setAttribute('data-store-custom', id);
  script.text = code;
  safeAppend(target, script);
}

// A vendor snippet with a syntax error can make appendChild throw (seen
// in Chrome). Log it and carry on, so one broken snippet never stops the
// ones after it. Returns false when the append threw.
function safeAppend(target: HTMLElement, node: Node): boolean {
  try {
    target.appendChild(node);
    return true;
  } catch (err) {
    console.error('[Store custom code] A custom script failed to run:', err);
    return false;
  }
}
