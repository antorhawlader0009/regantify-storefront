'use client';

import { useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import type { useVoiceSearch } from '@/lib/voiceSearch';
import { useStoreText } from '../lib/storeText';

type Voice = ReturnType<typeof useVoiceSearch>;

/** The mic in StorePal's search box (lib/voiceSearch.ts). Not drawn where the browser can't listen. */
export function VoiceSearchButton({ voice, className, onStart }: { voice: Voice; className?: string; onStart?: () => void }) {
  const t = useStoreText();
  if (!voice.supported) return null;
  return (
    <button
      type="button"
      onClick={() => {
        if (voice.listening) voice.stop();
        else {
          onStart?.();
          voice.start();
        }
      }}
      aria-label={voice.listening ? t('Stop') : t('Search by voice')}
      title={t('Search by voice')}
      aria-pressed={voice.listening}
      className={className}
    >
      {voice.listening ? <Mic size={16} className="animate-pulse text-red-600" /> : <Mic size={16} />}
    </button>
  );
}

/** Under the search box: "listening", the language switch while listening, and what went wrong (hidden again after a few seconds). */
export function VoiceSearchStatus({ voice, className = 'left-0 right-0' }: { voice: Voice; className?: string }) {
  const t = useStoreText();
  const { error, clearError } = voice;
  useEffect(() => {
    if (!error) return;
    const id = setTimeout(clearError, 5000);
    return () => clearTimeout(id);
  }, [error, clearError]);
  if (!voice.listening && !error) return null;

  return (
    <div role="status" aria-live="polite" className={`absolute top-full mt-1 z-40 rounded-lg border border-line bg-surface px-3.5 py-2.5 shadow-lg ${className}`}>
      {voice.listening ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-[13px] text-ink">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
            </span>
            {t('Listening… say what you are looking for')}
          </span>
          <span className="flex items-center gap-1 text-[12px]">
            {(['bn-BD', 'en-US'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => voice.setLang(l)}
                className={`rounded-md px-2 py-0.5 ${voice.lang === l ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}
              >
                {l === 'bn-BD' ? 'বাংলা' : 'English'}
              </button>
            ))}
            <button type="button" onClick={voice.stop} className="ml-1 flex items-center gap-1 rounded-md border border-line px-2 py-0.5 text-ink hover:bg-canvas">
              <MicOff size={12} aria-hidden />
              {t('Stop')}
            </button>
          </span>
        </div>
      ) : (
        <p className="text-[13px] text-muted">
          {error === 'denied'
            ? t('Allow the microphone to search by voice.')
            : error === 'no-speech'
              ? t("Didn't catch that. Tap the mic and try again.")
              : t('Voice search did not work. Please type instead.')}
        </p>
      )}
    </div>
  );
}
