import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';

interface PageViewProps {
  subdomain: string;
  storeName: string;
  categories: string[];
  title: string;
  content: string | null;
}

/** Store > Pages' public rendering under the Medium theme — a plain content card, same border/shadow/spacing conventions every other Medium page uses. */
export function PageView({ subdomain, storeName, categories, title, content }: PageViewProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <StoreHeader subdomain={subdomain} storeName={storeName} categories={categories} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-[22px] font-bold text-ink mb-5">{title}</h1>
        <div className="bg-surface border border-line rounded-lg p-5 sm:p-7 shadow-card">
          {content ? (
            <div
              className="text-[13.5px] text-ink/85 leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <p className="text-[13px] text-muted">This page has no content yet.</p>
          )}
        </div>
      </main>
      <StoreFooter subdomain={subdomain} storeName={storeName} />
    </div>
  );
}
