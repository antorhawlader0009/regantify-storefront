'use client';

import { useState } from 'react';
import { Stars } from './Stars';
import { PLACEHOLDER_REVIEWS } from '@/lib/placeholderContent';

/** Rendered inside the parent page's own bordered card — no outer
 * section/border/max-width here, this is just the tab content. */
export function ProductTabs({ description }: { description?: string | null }) {
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');

  return (
    <div className="p-4 sm:p-6">
      <div className="flex gap-6 border-b border-line mb-4">
        {(['description', 'reviews'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative py-3 px-0.5 bg-transparent border-0 text-[13px] font-semibold transition-colors ${
              activeTab === tab ? 'text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            {tab === 'reviews' ? `Reviews (${PLACEHOLDER_REVIEWS.length})` : 'Description'}
            {activeTab === tab && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-accent rounded-full" />}
          </button>
        ))}
      </div>

      {activeTab === 'description' ? (
        description ? (
          <div className="text-[13px] text-ink/85 leading-relaxed max-w-2xl" dangerouslySetInnerHTML={{ __html: description }} />
        ) : (
          <p className="text-[13px] text-muted">No description provided for this product.</p>
        )
      ) : (
        <div className="flex flex-col gap-4 max-w-2xl">
          {PLACEHOLDER_REVIEWS.map((r, i) => (
            <div key={i} className="border-b border-line pb-4 last:border-0">
              <Stars count={r.rating} />
              <p className="mt-1.5 text-[13px] text-ink leading-relaxed">{r.text}</p>
              <p className="mt-1 text-[12px] text-muted font-medium">{r.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
