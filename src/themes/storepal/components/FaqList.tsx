/**
 * The store's questions as an accordion (TellMe idea 122): each question opens its answer, one at a time or several, with the browser's own
 * <details>, so it works on a phone and without any script. The answers are the owner's cleaned rich text (links work).
 */
export function FaqList({ items }: { items: Array<{ id: string; question: string; answer: string }> }) {
  return (
    <div className="divide-y divide-line rounded-lg border border-line bg-surface">
      {items.map((item) => (
        <details key={item.id} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-[14px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <span className="shrink-0 text-[18px] leading-none text-muted transition-transform group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <div
            className="px-4 pb-4 text-[13.5px] leading-relaxed text-ink/85 [&_a]:text-accent [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
            // Cleaned when the owner saved it (faq/faq.ts).
            dangerouslySetInnerHTML={{ __html: item.answer }}
          />
        </details>
      ))}
    </div>
  );
}
