export default function StoreNotFound() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-2 text-center px-6">
      <p className="font-display text-2xl text-ink">Store not found</p>
      <p className="text-[13.5px] text-muted">This storefront address doesn&apos;t exist or is no longer active.</p>
    </div>
  );
}
