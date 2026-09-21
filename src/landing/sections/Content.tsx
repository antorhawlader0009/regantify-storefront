'use client';

import { useState } from 'react';
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
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt="" className="aspect-video w-full object-cover" />
            ) : (
              <div className="aspect-video w-full bg-neutral-100" />
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
          <FaqItem key={i} question={item.question} answer={item.answer} />
        ))}
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
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

export function CarouselSection({ props }: { props: CarouselProps }) {
  const items = props.items ?? [];
  if (items.length === 0) return null;
  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="flex snap-x gap-4 overflow-x-auto pb-2">
        {items.map((item, i) => (
          <a
            key={i}
            href={item.link || undefined}
            className="w-64 shrink-0 snap-start"
            target={item.link?.startsWith('#') ? undefined : item.link ? '_blank' : undefined}
            rel={item.link && !item.link.startsWith('#') ? 'noreferrer' : undefined}
          >
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
            ) : (
              <div className="aspect-[4/3] w-full rounded-lg bg-neutral-100" />
            )}
            {item.caption && <p className="mt-1.5 truncate text-center text-[12.5px] text-neutral-600">{item.caption}</p>}
          </a>
        ))}
      </div>
    </div>
  );
}
