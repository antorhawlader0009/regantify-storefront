'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown, Search } from 'lucide-react';
import { findDistrict, findThana, loadBdLocations, normalizeName, type BdDistrict, type BdLocations } from '@/lib/bdLocations';

const OTHER = '__other';

export interface BdAddressLabels {
  district: string;
  thana: string;
  /** "Select district" */
  districtPlaceholder: string;
  /** "Select thana / upazila" */
  thanaPlaceholder: string;
  /** "Choose a district first" */
  thanaNeedsDistrict: string;
  /** "Other (type it)" */
  other: string;
  /** Placeholders of the typed fallbacks. */
  typeDistrict: string;
  typeThana: string;
  /** The one field's label, "District & Thana" (defaults to "<district> & <thana>"). */
  place?: string;
  /** "Search district or thana" */
  search?: string;
}

interface Props {
  district: string;
  thana: string;
  onDistrict: (value: string) => void;
  onThana: (value: string) => void;
  /** Which language the list rows are shown in. The value kept is always the English name. */
  lang: 'en' | 'bn';
  labels: BdAddressLabels;
  /** Classes of the surrounding theme, so the fields look native to it. */
  labelClassName: string;
  controlClassName: string;
  /** Wraps the field (the checkout's own grid cell). */
  fieldClassName?: string;
  maxLength?: number;
}

/**
 * District and thana/upazila for Bangladesh addresses (StorePal checkout, account address), as ONE field (2026-10-28,
 * the owner's request, like a courier's "City, Zone & Area" picker): it reads "Dhaka › Uttara", and a tap opens a
 * searchable list of districts, then that district's thanas. Picking from the list gives every order the same
 * spelling, which courier booking, delivery reports and the "Around Dhaka" zone suggestion work from.
 *
 * Nobody is ever stuck: each list ends with "Other (type it)", an old saved address that isn't in the list shows
 * as typed text, and if the list can't load both parts are plain text boxes like before. The village or para goes
 * in the address line (no open dataset has the country's villages).
 *
 * The parent keeps `district` and `thana` as English text (what the order stores); this component only decides what
 * to show. Changing the district clears the thana.
 */
export function BdAddressPicker({ district, thana, onDistrict, onThana, lang, labels, labelClassName, controlClassName, fieldClassName, maxLength = 100 }: Props) {
  const [data, setData] = useState<BdLocations | 'failed' | null>(null);
  // "Other" picked on purpose, so the typed box can open while it is still empty.
  const [districtOther, setDistrictOther] = useState(false);
  const [thanaOther, setThanaOther] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'district' | 'thana'>('district');
  const [query, setQuery] = useState('');
  const fieldId = useId();
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let live = true;
    loadBdLocations()
      .then((loaded) => live && setData(loaded))
      .catch(() => live && setData('failed'));
    return () => {
      live = false;
    };
  }, []);

  // A tap outside or Escape closes the list.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open, step]);

  const loaded = data !== null && data !== 'failed' ? data : null;
  const matchedDistrict = loaded ? findDistrict(loaded, district) : null;
  const matchedThana = matchedDistrict ? findThana(matchedDistrict, thana) : null;
  const shownDistrict = (d: BdDistrict) => (lang === 'bn' ? d.b : d.n);
  const shownThana = (t: [string, string]) => (lang === 'bn' ? t[1] : t[0]);

  const rows = useMemo(() => {
    if (!loaded) return [] as Array<{ key: string; label: string; sub?: string }>;
    const key = normalizeName(query);
    if (step === 'district') {
      return loaded.districts
        .filter((d) => !key || normalizeName(d.n).includes(key) || normalizeName(d.b).includes(key))
        .map((d) => ({ key: d.n, label: shownDistrict(d), sub: lang === 'bn' ? d.n : d.b }));
    }
    return (matchedDistrict?.t ?? [])
      .filter((t) => !key || normalizeName(t[0]).includes(key) || normalizeName(t[1]).includes(key))
      .map((t) => ({ key: t[0], label: shownThana(t), sub: lang === 'bn' ? t[0] : t[1] }));
    // shownDistrict/shownThana only read `lang`, which is in the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, query, step, matchedDistrict, lang]);

  const cell = fieldClassName ?? '';
  const placeLabel = labels.place ?? `${labels.district} & ${labels.thana}`;

  // List not loaded yet, or couldn't load: two text boxes, like the checkout always had.
  if (!loaded) {
    return (
      <>
        <div className={cell}>
          <label htmlFor={`${fieldId}-d`} className={labelClassName}>{labels.district}</label>
          <input id={`${fieldId}-d`} value={district} onChange={(e) => onDistrict(e.target.value)} placeholder={labels.typeDistrict} maxLength={maxLength} disabled={data === null} className={controlClassName} />
        </div>
        <div className={cell}>
          <label htmlFor={`${fieldId}-t`} className={labelClassName}>{labels.thana}</label>
          <input id={`${fieldId}-t`} value={thana} onChange={(e) => onThana(e.target.value)} placeholder={labels.typeThana} maxLength={maxLength} disabled={data === null} className={controlClassName} />
        </div>
      </>
    );
  }

  const districtTyped = !matchedDistrict && (districtOther || !!district.trim());
  const thanaTyped = !!matchedDistrict && !matchedThana && (thanaOther || !!thana.trim());

  // Opens the list at a step: the district part opens districts, the thana part that district's thanas. With no step
  // given, a chosen district with no thana yet goes straight to its thanas.
  const openList = (at?: 'district' | 'thana') => {
    setQuery('');
    const wanted = at ?? (matchedDistrict && !matchedThana && !thanaTyped ? 'thana' : 'district');
    setStep(wanted === 'thana' && !matchedDistrict ? 'district' : wanted);
    setOpen(true);
  };

  const chooseDistrict = (value: string) => {
    setQuery('');
    if (value !== matchedDistrict?.n) {
      onThana('');
      setThanaOther(false);
    }
    if (value === OTHER) {
      setDistrictOther(true);
      onDistrict('');
      setOpen(false);
      return;
    }
    setDistrictOther(false);
    onDistrict(value);
    setStep('thana');
  };

  const chooseThana = (value: string) => {
    if (value === OTHER) {
      setThanaOther(true);
      onThana('');
    } else {
      setThanaOther(false);
      onThana(value);
    }
    setOpen(false);
  };

  const choose = (value: string) => (step === 'district' ? chooseDistrict(value) : chooseThana(value));

  // What the closed field reads: "Dhaka › Uttara", with the part still missing in grey.
  const districtText = matchedDistrict ? shownDistrict(matchedDistrict) : districtTyped ? district.trim() || labels.other : '';
  const thanaText = matchedThana ? shownThana(matchedThana) : thana.trim() ? thana.trim() : '';

  return (
    <div className={cell}>
      <label id={`${fieldId}-label`} className={labelClassName}>{placeLabel}</label>
      <div ref={boxRef} className="relative">
        {/* The field reads "Dhaka › Cantonment"; each part is its own button (the district opens the district list, the thana
            that district's thanas), and the arrows at the end open whichever step is next. */}
        <div className={`${controlClassName} flex items-center gap-1`} role="group" aria-labelledby={`${fieldId}-label`}>
          <span className="flex min-w-0 flex-1 items-center gap-0.5">
            <button
              type="button"
              onClick={() => (open && step === 'district' ? setOpen(false) : openList('district'))}
              aria-haspopup="listbox"
              aria-expanded={open && step === 'district'}
              aria-controls={listId}
              aria-label={`${labels.district}: ${districtText || labels.districtPlaceholder}`}
              className={`-mx-1 min-w-0 max-w-[55%] truncate rounded px-1.5 py-0.5 text-left transition-colors hover:bg-canvas ${
                open && step === 'district' ? 'bg-canvas' : ''
              } ${districtText ? 'text-ink' : 'text-muted'}`}
            >
              {districtText || labels.districtPlaceholder}
            </button>
            {districtText && (
              <>
                <ChevronRight size={14} className="mx-0.5 shrink-0 text-muted" aria-hidden />
                <button
                  type="button"
                  onClick={() => (open && step === 'thana' ? setOpen(false) : openList('thana'))}
                  disabled={!matchedDistrict}
                  aria-haspopup="listbox"
                  aria-expanded={open && step === 'thana'}
                  aria-controls={listId}
                  aria-label={`${labels.thana}: ${thanaText || labels.thanaPlaceholder}`}
                  className={`min-w-0 truncate rounded px-1.5 py-0.5 text-left transition-colors hover:bg-canvas disabled:hover:bg-transparent ${
                    open && step === 'thana' ? 'bg-canvas' : ''
                  } ${thanaText ? 'text-ink' : 'text-muted'}`}
                >
                  {thanaText || labels.thanaPlaceholder}
                </button>
              </>
            )}
          </span>
          <button
            type="button"
            onClick={() => (open ? setOpen(false) : openList())}
            aria-label={placeLabel}
            aria-expanded={open}
            aria-controls={listId}
            className="-mr-1 shrink-0 rounded p-1 text-muted hover:bg-canvas hover:text-ink"
          >
            <ChevronsUpDown size={15} aria-hidden />
          </button>
        </div>

        {open && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-md border border-line-strong bg-surface shadow-popover">
            <div className="border-b border-line p-2">
              {step === 'thana' && matchedDistrict && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setStep('district');
                  }}
                  className="mb-2 inline-flex items-center gap-1 rounded px-1 py-0.5 text-[12.5px] font-medium text-accent hover:text-accent-dark"
                >
                  <ChevronLeft size={14} aria-hidden />
                  {shownDistrict(matchedDistrict)}
                </button>
              )}
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (rows[0]) choose(rows[0].key);
                    }
                  }}
                  placeholder={labels.search ?? (step === 'district' ? labels.districtPlaceholder : labels.thanaPlaceholder)}
                  aria-label={labels.search ?? placeLabel}
                  className="w-full rounded border border-line bg-canvas py-2 pl-8 pr-2.5 text-[13.5px] outline-none focus:border-ink"
                />
              </div>
            </div>
            <ul id={listId} role="listbox" aria-label={step === 'district' ? labels.district : labels.thana} className="m-0 max-h-64 list-none overflow-y-auto p-1">
              {rows.map((r) => {
                const selected = step === 'district' ? r.key === matchedDistrict?.n : r.key === matchedThana?.[0];
                return (
                  <li key={r.key} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => choose(r.key)}
                      className={`flex w-full items-center justify-between gap-3 rounded px-2.5 py-2 text-left text-[13.5px] hover:bg-canvas ${selected ? 'font-semibold text-accent' : 'text-ink'}`}
                    >
                      <span className="truncate">{r.label}</span>
                      {step === 'district' ? <ChevronRight size={14} className="shrink-0 text-muted" aria-hidden /> : r.sub && <span className="shrink-0 text-[11.5px] text-muted">{r.sub}</span>}
                    </button>
                  </li>
                );
              })}
              <li role="option" aria-selected={false}>
                <button type="button" onClick={() => choose(OTHER)} className="w-full rounded px-2.5 py-2 text-left text-[13px] text-muted hover:bg-canvas">
                  {labels.other}
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Not in the list: typed text instead (a district outside the list means its thana is typed too). */}
      {districtTyped && (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input value={district} onChange={(e) => onDistrict(e.target.value)} placeholder={labels.typeDistrict} maxLength={maxLength} aria-label={labels.district} className={controlClassName} />
          <input value={thana} onChange={(e) => onThana(e.target.value)} placeholder={labels.typeThana} maxLength={maxLength} aria-label={labels.thana} className={controlClassName} />
        </div>
      )}
      {thanaTyped && (
        <input value={thana} onChange={(e) => onThana(e.target.value)} placeholder={labels.typeThana} maxLength={maxLength} aria-label={labels.thana} className={`${controlClassName} mt-2`} />
      )}
    </div>
  );
}

