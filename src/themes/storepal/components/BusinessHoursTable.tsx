'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { useBusinessHours, useStorePalDesign } from '../lib/designSettings';
import { isOpenNow, timeLabel } from '@/lib/businessHours';
import { bnDigits } from '../lib/storeText';

const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'];

/** The store's hours as a small table with "Open now" / "Closed now" (TellMe idea 73); nothing when no hours are set. */
export function BusinessHoursTable() {
  const hours = useBusinessHours();
  const design = useStorePalDesign();
  const bn = design.storeLanguage === 'bn';
  // Open or closed is judged in the browser after load, so a cached page never shows a stale answer.
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    if (hours) setOpen(isOpenNow(hours));
  }, [hours]);
  if (!hours) return null;
  const fmt = (t: string) => (bn ? bnDigits(timeLabel(t)) : timeLabel(t));
  return (
    <div className="text-[13px] text-ink">
      <p className="m-0 mb-2 flex items-center gap-1.5 font-semibold">
        <Clock size={14} />
        {bn ? 'আমাদের কাজের সময়' : 'Business hours'}
        {open !== null && (
          <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${open ? 'bg-success-bg text-success' : 'bg-canvas text-muted'}`}>
            {open ? (bn ? 'এখন খোলা' : 'Open now') : bn ? 'এখন বন্ধ' : 'Closed now'}
          </span>
        )}
      </p>
      <table className="border-collapse">
        <tbody>
          {(bn ? DAYS_BN : DAYS_EN).map((name, i) => {
            const d = hours[String(i)];
            return (
              <tr key={name}>
                <td className="py-0.5 pr-4 text-muted">{name}</td>
                <td className="py-0.5">{d?.open ? `${fmt(d.from)} – ${fmt(d.to)}` : bn ? 'বন্ধ' : 'Closed'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
