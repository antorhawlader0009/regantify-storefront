// Skeleton screens shown while a store page is on its way (the route's loading.tsx), for every template:
// plain grey shapes (.rg-skel in globals.css) in the rough layout of the page, so the shopper sees the page
// taking shape instead of a blank screen. Server components, no data, no script.

const WRAP = 'max-w-6xl mx-auto px-3 sm:px-6';

function Bar({ className }: { className: string }) {
  return <div className={`rg-skel ${className}`} />;
}

function HeaderSkeleton() {
  return (
    <div className="border-b border-black/5">
      <div className={`${WRAP} flex h-16 items-center gap-4`}>
        <Bar className="h-7 w-28 shrink-0" />
        <Bar className="hidden h-10 flex-1 sm:block" />
        <div className="ml-auto flex gap-3 sm:ml-0">
          <Bar className="h-8 w-8 !rounded-full" />
          <Bar className="h-8 w-8 !rounded-full" />
          <Bar className="h-8 w-8 !rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <Bar className="aspect-square w-full" />
      <Bar className="mt-3 h-3.5 w-11/12" />
      <Bar className="mt-2 h-3.5 w-2/3" />
      <Bar className="mt-3 h-4 w-1/3" />
      <div className="mt-3 flex gap-2">
        <Bar className="h-9 flex-1" />
        <Bar className="h-9 flex-1" />
      </div>
    </div>
  );
}

function CardGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Home, category, brand and search pages (and any store page without its own skeleton). */
export function StoreHomeSkeleton() {
  return (
    <div className="min-h-screen" role="status" aria-busy="true" aria-label="Loading">
      <HeaderSkeleton />
      <div className={`${WRAP} pt-5 sm:pt-6`}>
        <Bar className="h-40 w-full sm:h-72" />
        <div className="mt-6 flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex shrink-0 flex-col items-center gap-2">
              <Bar className="h-16 w-16 !rounded-full sm:h-20 sm:w-20" />
              <Bar className="h-3 w-14" />
            </div>
          ))}
        </div>
        <Bar className="mb-4 mt-8 h-5 w-36" />
        <CardGrid count={8} />
      </div>
    </div>
  );
}

/** A product page: photos on one side, name, price and buttons on the other. */
export function StoreProductSkeleton() {
  return (
    <div className="min-h-screen" role="status" aria-busy="true" aria-label="Loading">
      <HeaderSkeleton />
      <div className={`${WRAP} pt-5 sm:pt-8`}>
        <Bar className="mb-5 h-3 w-48" />
        <div className="grid gap-6 md:grid-cols-2 md:gap-10">
          <div>
            <Bar className="aspect-square w-full" />
            <div className="mt-3 flex gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Bar key={i} className="h-16 w-16" />
              ))}
            </div>
          </div>
          <div>
            <Bar className="h-7 w-11/12" />
            <Bar className="mt-2 h-7 w-2/3" />
            <Bar className="mt-5 h-8 w-32" />
            <Bar className="mt-6 h-4 w-20" />
            <div className="mt-2 flex gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Bar key={i} className="h-9 w-14" />
              ))}
            </div>
            <Bar className="mt-6 h-10 w-36" />
            <div className="mt-5 flex gap-3">
              <Bar className="h-12 flex-1" />
              <Bar className="h-12 flex-1" />
            </div>
            <Bar className="mt-8 h-3.5 w-full" />
            <Bar className="mt-2 h-3.5 w-full" />
            <Bar className="mt-2 h-3.5 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
