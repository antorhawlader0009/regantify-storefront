'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { recognitionCtor, type Recognition } from './voice/speechInput';
import { trackFeature } from '@/lib/featureUse';

/**
 * Search by voice (shared by every template; each template only draws its own mic button). The browser's own speech recognition
 * (Web Speech API: Chrome, Edge, Samsung Internet, Safari) turns what the shopper says into text: free, nothing goes to our server,
 * and Google's "bn-BD" model also writes the English words people mix in. Firefox has none, so `supported` is false there and the
 * template shows no mic at all. The words are shown in the search box while the shopper talks; when they stop, `onText` gets the
 * final text and the template runs its normal search, so the search rules (product names, hidden search words) stay the same.
 */

export type VoiceSearchLang = 'bn-BD' | 'en-US';
export type VoiceSearchError = 'denied' | 'no-speech' | 'failed';

const LANG_KEY = 'regantify-voice-search-lang';
/** Nothing heard for this long after tapping: stop rather than keep the microphone open. */
const SILENCE_MS = 7000;

/** "লাল শাড়ি।" -> "লাল শাড়ি": the recogniser's full stops and question marks don't belong in a search. */
export function cleanVoiceQuery(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[।.,!?؟]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function savedLang(): VoiceSearchLang {
  try {
    return localStorage.getItem(LANG_KEY) === 'en-US' ? 'en-US' : 'bn-BD';
  } catch {
    return 'bn-BD';
  }
}

/** Dictation (a chat message): the sentence as spoken, punctuation kept, up to 500 characters. */
function cleanDictation(text: string): string {
  return text.normalize('NFC').replace(/\s+/g, ' ').trim().slice(0, 500);
}

/**
 * `mode: 'dictation'` is for typing a message by voice (the store AI chat): the words keep their punctuation and length,
 * and it is not counted as a voice search in the store's feature-use report.
 */
export function useVoiceSearch({
  onInterim,
  onText,
  mode = 'search',
}: {
  onInterim?: (text: string) => void;
  onText: (text: string) => void;
  mode?: 'search' | 'dictation';
}) {
  const clean = mode === 'dictation' ? cleanDictation : cleanVoiceQuery;
  // Known only in the browser, so the first render (server and browser alike) has no mic.
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<VoiceSearchError | null>(null);
  const [lang, setLangState] = useState<VoiceSearchLang>('bn-BD');
  const rec = useRef<Recognition | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Set when a session is thrown away (language switched): its words are not searched and no error is shown. */
  const discard = useRef(false);
  const restartWith = useRef<VoiceSearchLang | null>(null);
  const handlers = useRef({ onInterim, onText });
  handlers.current = { onInterim, onText };

  useEffect(() => {
    setSupported(!!recognitionCtor() && window.isSecureContext !== false);
    setLangState(savedLang());
    return () => rec.current?.abort();
  }, []);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const stop = useCallback(() => {
    clearTimer();
    rec.current?.stop();
  }, []);

  /** Stops and throws away what was heard (the chat message was sent while the mic was still listening). */
  const cancel = useCallback(() => {
    if (!rec.current) return;
    clearTimer();
    discard.current = true;
    rec.current.abort();
  }, []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    rec.current?.abort();
    const r = new Ctor();
    r.lang = lang;
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;
    let finalText = '';
    let heard = false;
    r.onresult = (e) => {
      heard = true;
      clearTimer();
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }
      handlers.current.onInterim?.(clean(finalText + interim));
    };
    r.onerror = (e) => {
      if (discard.current) return;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setError('denied');
      else if (e.error === 'no-speech') setError('no-speech');
      else if (e.error !== 'aborted') setError('failed');
    };
    r.onend = () => {
      clearTimer();
      setListening(false);
      rec.current = null;
      if (discard.current) {
        discard.current = false;
        return;
      }
      const text = clean(finalText);
      if (text) handlers.current.onText(text);
      else if (!heard) setError((cur) => cur ?? 'no-speech');
    };
    setError(null);
    setListening(true);
    rec.current = r;
    try {
      r.start();
      if (mode === 'search') trackFeature('VOICE_SEARCH');
    } catch {
      setListening(false);
      setError('failed');
      return;
    }
    timer.current = setTimeout(() => r.stop(), SILENCE_MS);
  }, [lang, clean, mode]);

  /** The shopper's choice of language, kept in this browser. While listening, it starts again in the new language. */
  const setLang = useCallback((next: VoiceSearchLang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* private mode: the choice lasts this visit */
    }
    if (rec.current) {
      discard.current = true;
      restartWith.current = next;
      clearTimer();
      rec.current.abort();
    }
  }, []);

  // A language switch while listening: start again once the new language is in place.
  useEffect(() => {
    if (restartWith.current === lang && !listening) {
      restartWith.current = null;
      start();
    }
  }, [lang, listening, start]);

  const clearError = useCallback(() => setError(null), []);
  return { supported, listening, error, lang, setLang, start, stop, cancel, clearError };
}
