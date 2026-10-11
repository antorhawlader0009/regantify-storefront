'use client';

import { RotateCcw, ShieldCheck } from 'lucide-react';
import { policyLines, type ResolvedPolicy } from '../lib/policy';
import { useStorePalDesign } from '../lib/designSettings';

/** Under the Buy button: the product's warranty and return/exchange lines (two small icon lines). Nothing when none is set. */
export function ProductPolicyLines({ policy }: { policy: ResolvedPolicy | null }) {
  const design = useStorePalDesign();
  const { warranty, returns } = policyLines(policy, design.storeLanguage);
  if (!warranty && !returns) return null;
  return (
    <ul className="m-0 mt-3 list-none space-y-1.5 p-0 text-[13px] text-muted">
      {warranty && (
        <li className="flex items-start gap-1.5">
          <ShieldCheck size={15} className="mt-0.5 shrink-0" />
          <span>{warranty}</span>
        </li>
      )}
      {returns && (
        <li className="flex items-start gap-1.5">
          <RotateCcw size={15} className="mt-0.5 shrink-0" />
          <span>{returns}</span>
        </li>
      )}
    </ul>
  );
}
