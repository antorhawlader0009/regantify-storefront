export function Stars({ count }: { count: number }) {
  return (
    <span className="text-ink text-[12px] tracking-widest">
      {'★'.repeat(count)}
      <span className="text-line-strong">{'★'.repeat(5 - count)}</span>
    </span>
  );
}
