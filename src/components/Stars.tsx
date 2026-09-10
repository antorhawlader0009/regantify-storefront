export function Stars({ count }: { count: number }) {
  return (
    <span className="text-[#f5a623] text-[13px] tracking-widest">
      {'★'.repeat(count)}
      <span className="text-[#ddd]">{'★'.repeat(5 - count)}</span>
    </span>
  );
}
