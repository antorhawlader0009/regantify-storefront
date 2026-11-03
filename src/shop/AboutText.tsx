'use client';

import { useState } from 'react';

/** "Product Details" with three lines and an underlined "Read more" in the accent colour, like the reference picture. */
export function AboutText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 220;
  return (
    <section>
      <h2 className="mb-1.5 text-[15px] font-bold text-slate-900">Product details</h2>
      <p className={`whitespace-pre-line text-sm leading-relaxed text-slate-600 ${open || !long ? '' : 'line-clamp-3'}`}>{text}</p>
      {long ? (
        <button type="button" onClick={() => setOpen((o) => !o)} className="mt-1 text-sm font-medium text-[var(--shop-accent)] underline underline-offset-2">
          {open ? 'Show less' : 'Read more'}
        </button>
      ) : null}
      <hr className="mt-5 border-slate-100" />
    </section>
  );
}
