'use client';

import { useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { LandingPhoto, usePhotoZoom } from '../LandingPhoto';
import type { LandingLang } from '../landingText';
import type { CarouselProps, FaqProps, FeatureGridProps } from '../types';

export function FeatureGridSection({ props }: { props: FeatureGridProps }) {
  const items = props.items ?? [];
  if (items.length === 0) return null;
  const cols = props.columns ?? 3;
  const colsClass = cols === 2 ? 'sm:grid-cols-2' : cols === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3';

  return (
    <div className="px-5 py-10 sm:px-8">
      {props.title && (
        <h2 className="mb-6 text-center text-2xl font-bold text-neutral-900 sm:text-3xl">{props.title}</h2>
      )}
      <div className={`mx-auto grid max-w-5xl grid-cols-1 gap-5 ${colsClass}`}>
        {items.map((item, i) => (
          <div key={i} className="group overflow-hidden rounded-xl border border-neutral-200 text-center">
            {/* No picture = a tick badge instead of an empty grey box (ready-made pages start with text-only cards). */}
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt="" className="aspect-video w-full object-cover" />
            ) : (
              <span className="mx-auto mt-5 flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-orange-600" aria-hidden>
                <BadgeCheck size={22} />
              </span>
            )}
            <div className="relative p-4">
              <h3 className="text-[15px] font-semibold text-neutral-900">{item.title}</h3>
              {item.description && (
                <p
                  className={
                    props.hoverReveal
                      ? 'mt-1 max-h-0 overflow-hidden text-[13px] text-neutral-600 opacity-0 transition-all duration-300 group-hover:max-h-40 group-hover:opacity-100'
                      : 'mt-1 text-[13px] text-neutral-600'
                  }
                >
                  {item.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FaqSection({ props }: { props: FaqProps }) {
  const items = props.items ?? [];
  if (items.length === 0) return null;
  return (
    <div className="px-5 py-10 sm:px-8">
      {props.title && (
        <h2 className="mb-6 text-center text-2xl font-bold text-neutral-900 sm:text-3xl">{props.title}</h2>
      )}
      <div className="mx-auto flex max-w-2xl flex-col gap-2">
        {items.map((item, i) => (
          <FaqItem key={i} question={item.question} answer={item.answer} startOpen={i === 0} />
        ))}
      </div>
    </div>
  );
}

function FaqItem({ question, answer, startOpen = false }: { question: string; answer: string; startOpen?: boolean }) {
  // The first answer starts open, so a shopper sees at once that the list opens.
  const [open, setOpen] = useState(startOpen);
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-[14px] font-medium text-neutral-900">{question}</span>
        <span className={`shrink-0 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}>&#9660;</span>
      </button>
      {open && <p className="border-t border-neutral-100 px-4 py-3 text-[13.5px] leading-relaxed text-neutral-600">{answer}</p>}
    </div>
  );
}

/**
 * The photo row. Each photo shows whole in a square (never cropped), the row scrolls sideways with a peek of the next
 * photo so a phone user sees there are more, and a tap opens the full-screen viewer with zoom (photos without a link).
 * A photo with a link still goes to its link.
 */
export function CarouselSection({ props, lang = 'en' }: { props: CarouselProps; lang?: LandingLang }) {
  const items = (props.items ?? []).filter((item) => item.imageUrl);
  const photos = items.map((item) => item.imageUrl);
  const zoom = usePhotoZoom(photos, 'Photo', lang);
  if (items.length === 0) return null;
  return (
    <div className="py-8">
      <div className="mx-auto flex max-w-5xl snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:px-8 [scrollbar-width:thin]">
        {items.map((item, i) => {
          const photo = (
            <LandingPhoto
              src={item.imageUrl}
              alt={item.caption || ''}
              className="aspect-square w-full rounded-xl ring-1 ring-black/5"
              sizes="(max-width: 640px) 75vw, 288px"
              onOpen={item.link ? undefined : () => zoom.open(i)}
            />
          );
          return (
            <div key={i} className="w-[75%] shrink-0 snap-start sm:w-72">
              {item.link ? (
                <a
                  href={item.link}
                  target={item.link.startsWith('#') ? undefined : '_blank'}
                  rel={item.link.startsWith('#') ? undefined : 'noreferrer'}
                >
                  {photo}
                </a>
              ) : (
                photo
              )}
              {item.caption && <p className="mt-1.5 truncate text-center text-[12.5px] text-neutral-600">{item.caption}</p>}
            </div>
          );
        })}
      </div>
      {zoom.viewer}
    </div>
  );
}
