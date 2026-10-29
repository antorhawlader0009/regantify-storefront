'use client';

import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown, Search } from 'lucide-react';
import { areasOf, findArea, findDistrict, findThana, loadBdLocations, normalizeName, type BdDistrict, type BdLocations, type BdThana } from '@/lib/bdLocations';

const OTHER = '__other';

type Step = 'district' | 'thana' | 'area';

export interface BdAddressLabels {
  district: string;
  thana: string;
  /** "Select district" (the empty district part of the field). */
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
  /** The optional third part (only with `onArea`): "Area", its empty text and the typed fallback's placeholder. */
  area?: string;
  areaPlaceholder?: string;
  typeArea?: string;
}

interface Props {
  district: string;
  thana: string;
  onDistrict: (value: string) => void;
  onThana: (value: string) => void;
  /** The optional third part, the area inside the thana ("Mirpur-10"). Shown only when `onArea` is given. */
  area?: string;
  onArea?: (value: string) => void;
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
 * District and thana/upazila (and, when the parent asks, the area) for Bangladesh addresses, as ONE field like a
 * courier's "City, Zone & Area" picker (2026-10-28, the owner's request): it reads "Dhaka › Uttara › Sector 4", every
 * part still to pick in grey ("Dhaka › Zone › Area"), and each part opens its own searchable list. Picking from the list
 * gives every order the same spelling, which courier booking, delivery reports and the "Around Dhaka" zone suggestion
 * work from.
 *
 * Areas exist only for about 117 of the 531 thanas (city wards and unions, from the same open data), so the area is
 * always optional: a thana without a list goes straight to "Other (type it)".
 *
 * Nobody is ever stuck: each list ends with "Other (type it)", an old saved address that isn't in the list shows
 * as typed text, and if the list can't load the parts are plain text boxes like before.
 *
 * The parent keeps the values as English text (what the order stores); this component only decides what to show.
 * Changing the district clears the thana and the area, changing the thana clears the area.
 */
/**
 * The districts most online orders go to, first in the district list (2026-10-29, the owner's request); the rest stay A to Z. No public
 * per-district sales figures exist, so this follows what is known: Dhaka is far ahead (one Daraz report put 45% of its orders in Dhaka city),
 * then the big cities and the factory belt around Dhaka, then the divisional cities, roughly by urban population. Thanas and areas are not
 * reordered. Names are the English names in data/bdLocations.json.
 */
const TOP_DISTRICTS = [
  'Dhaka',
  'Chattogram',
  'Gazipur',
  'Narayanganj',
  'Sylhet',
  'Cumilla',
  'Rajshahi',
  'Khulna',
  'Mymensingh',
  'Rangpur',
  'Bogura',
  'Barishal',
];
const TOP_RANK = new Map(TOP_DISTRICTS.map((name, i) => [name, i]));

function byOrderVolume<T extends { n: string }>(districts: T[]): T[] {
  return [...districts].sort((a, b) => (TOP_RANK.get(a.n) ?? 99) - (TOP_RANK.get(b.n) ?? 99));
}

export function BdAddressPicker({
  district,
  thana,
  onDistrict,
  onThana,
  area = '',
  onArea,
  lang,
  labels,
  labelClassName,
  controlClassName,
  fieldClassName,
  maxLength = 100,
}: Props) {
  const [data, setData] = useState<BdLocations | 'failed' | null>(null);
  // "Other" picked on purpose, so the typed box can open while it is still empty.
  const [districtOther, setDistrictOther] = useState(false);
  const [thanaOther, setThanaOther] = useState(false);
  const [areaOther, setAreaOther] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('district');
  const [query, setQuery] = useState('');
  const fieldId = useId();
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const withArea = !!onArea;

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
  const areaList = areasOf(matchedThana);
  const matchedArea = findArea(matchedThana, area);
  const shownDistrict = (d: BdDistrict) => (lang === 'bn' ? d.b : d.n);
  const shownPair = (t: BdThana | [string, string]) => (lang === 'bn' ? t[1] : t[0]);

  const rows = useMemo(() => {
    if (!loaded) return [] as Array<{ key: string; label: string; sub?: string; more?: boolean }>;
    const key = normalizeName(query);
    const pairs = (list: Array<BdThana | [string, string]>) =>
      list
        .filter((t) => !key || normalizeName(t[0]).includes(key) || normalizeName(t[1]).includes(key))
        .map((t) => ({ key: t[0], label: shownPair(t), sub: lang === 'bn' ? t[0] : t[1], more: withArea && t.length === 3 }));
    if (step === 'district') {
      return byOrderVolume(loaded.districts)
        .filter((d) => !key || normalizeName(d.n).includes(key) || normalizeName(d.b).includes(key))
        .map((d) => ({ key: d.n, label: shownDistrict(d), sub: lang === 'bn' ? d.n : d.b, more: true }));
    }
    if (step === 'thana') return pairs(matchedDistrict?.t ?? []);
    return pairs(areaList).map((r) => ({ ...r, more: false }));
    // shownDistrict/shownPair only read `lang`, which is in the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, query, step, matchedDistrict, areaList, lang, withArea]);

  const cell = fieldClassName ?? '';
  const placeLabel = labels.place ?? `${labels.district} & ${labels.thana}`;
  const areaLabel = labels.area ?? 'Area';

  // List not loaded yet, or couldn't load: plain text boxes, like the checkout always had.
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
        {withArea && (
          <div className={cell}>
            <label htmlFor={`${fieldId}-a`} className={labelClassName}>{areaLabel}</label>
            <input id={`${fieldId}-a`} value={area} onChange={(e) => onArea?.(e.target.value)} placeholder={labels.typeArea ?? areaLabel} maxLength={maxLength} disabled={data === null} className={controlClassName} />
          </div>
        )}
      </>
    );
  }

  const districtTyped = !matchedDistrict && (districtOther || !!district.trim());
  const thanaTyped = !!matchedDistrict && !matchedThana && (thanaOther || !!thana.trim());
  // The area is typed after "Other (type it)" (a thana with no list shows only that row), or for an old typed value.
  const areaTyped = withArea && !!thana.trim() && !matchedArea && (areaOther || !!area.trim());

  // Opens the list at a step. With no step given, the first part still to pick opens.
  const openList = (at?: Step) => {
    setQuery('');
    let wanted: Step = at ?? (!matchedDistrict ? 'district' : !matchedThana && !thanaTyped ? 'thana' : withArea && areaList.length > 0 && !matchedArea ? 'area' : 'district');
    if (wanted === 'area' && !thana.trim()) wanted = 'thana';
    if (wanted === 'thana' && !matchedDistrict) wanted = 'district';
    setStep(wanted);
    setOpen(true);
  };

  const chooseDistrict = (value: string) => {
    setQuery('');
    if (value !== matchedDistrict?.n) {
      onThana('');
      setThanaOther(false);
      onArea?.('');
      setAreaOther(false);
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
    setQuery('');
    if (value !== matchedThana?.[0]) {
      onArea?.('');
      setAreaOther(false);
    }
    if (value === OTHER) {
      setThanaOther(true);
      onThana('');
      setOpen(false);
      return;
    }
    setThanaOther(false);
    onThana(value);
    // On to the area when the parent wants one and this thana has a list; otherwise done.
    const next = matchedDistrict ? findThana(matchedDistrict, value) : null;
    if (withArea && areasOf(next).length > 0) setStep('area');
    else setOpen(false);
  };

  const chooseArea = (value: string) => {
    if (value === OTHER) {
      setAreaOther(true);
      onArea?.('');
    } else {
      setAreaOther(false);
      onArea?.(value);
    }
    setOpen(false);
  };

  const choose = (value: string) => (step === 'district' ? chooseDistrict(value) : step === 'thana' ? chooseThana(value) : chooseArea(value));

  // What the closed field reads: "Dhaka › Uttara › Sector 4", every part still to pick in grey.
  const districtText = matchedDistrict ? shownDistrict(matchedDistrict) : districtTyped ? district.trim() || labels.other : '';
  const thanaText = matchedThana ? shownPair(matchedThana) : thana.trim() ? thana.trim() : '';
  const areaText = matchedArea ? shownPair(matchedArea) : area.trim();

  const parts: Array<{ step: Step; text: string; empty: string; label: string; disabled: boolean }> = [
    { step: 'district', text: districtText, empty: labels.districtPlaceholder, label: labels.district, disabled: false },
    { step: 'thana', text: thanaText, empty: labels.thanaPlaceholder, label: labels.thana, disabled: !matchedDistrict },
  ];
  if (withArea) parts.push({ step: 'area', text: areaText, empty: labels.areaPlaceholder ?? areaLabel, label: areaLabel, disabled: !thana.trim() });

  const backTo: { step: Step; text: string } | null =
    step === 'thana' && matchedDistrict
      ? { step: 'district', text: shownDistrict(matchedDistrict) }
      : step === 'area' && matchedThana
        ? { step: 'thana', text: shownPair(matchedThana) }
        : null;

  return (
    <div className={cell}>
      <label id={`${fieldId}-label`} className={labelClassName}>{placeLabel}</label>
      <div ref={boxRef} className="relative">
        {/* The field reads "Dhaka › Zone › Area"; each part is its own button that opens its own list, and the arrows at
            the end open whichever part is next. */}
        <div className={`${controlClassName} flex items-center gap-1`} role="group" aria-labelledby={`${fieldId}-label`}>
          <span className="flex min-w-0 flex-1 items-center gap-0.5">
            {parts.map((p, i) => (
              <Fragment key={p.step}>
                {i > 0 && <ChevronRight size={14} className="mx-0.5 shrink-0 text-muted" aria-hidden />}
                <button
                  type="button"
                  onClick={() => (open && step === p.step ? setOpen(false) : openList(p.step))}
                  disabled={p.disabled}
                  aria-haspopup="listbox"
                  aria-expanded={open && step === p.step}
                  aria-controls={listId}
                  aria-label={`${p.label}: ${p.text || p.empty}`}
                  className={`${i === 0 ? '-mx-1' : ''} min-w-0 ${i === 0 ? 'max-w-[45%]' : ''} truncate rounded px-1.5 py-0.5 text-left transition-colors hover:bg-canvas disabled:cursor-default disabled:hover:bg-transparent ${
                    open && step === p.step ? 'bg-canvas' : ''
                  } ${p.text ? 'text-ink' : 'text-muted'}`}
                >
                  {p.text || p.empty}
                </button>
              </Fragment>
            ))}
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
              {backTo && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setStep(backTo.step);
                  }}
                  className="mb-2 inline-flex items-center gap-1 rounded px-1 py-0.5 text-[12.5px] font-medium text-accent hover:text-accent-dark"
                >
                  <ChevronLeft size={14} aria-hidden />
                  {backTo.text}
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
                  placeholder={labels.search ?? (step === 'district' ? labels.districtPlaceholder : step === 'thana' ? labels.thanaPlaceholder : (labels.areaPlaceholder ?? areaLabel))}
                  aria-label={labels.search ?? placeLabel}
                  className="w-full rounded border border-line bg-canvas py-2 pl-8 pr-2.5 text-[13.5px] outline-none focus:border-ink"
                />
              </div>
            </div>
            <ul id={listId} role="listbox" aria-label={step === 'district' ? labels.district : step === 'thana' ? labels.thana : areaLabel} className="m-0 max-h-64 list-none overflow-y-auto p-1">
              {rows.map((r) => {
                const selected = step === 'district' ? r.key === matchedDistrict?.n : step === 'thana' ? r.key === matchedThana?.[0] : r.key === matchedArea?.[0];
                return (
                  <li key={r.key} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => choose(r.key)}
                      className={`flex w-full items-center justify-between gap-3 rounded px-2.5 py-2 text-left text-[13.5px] hover:bg-canvas ${selected ? 'font-semibold text-accent' : 'text-ink'}`}
                    >
                      <span className="truncate">{r.label}</span>
                      {r.more ? <ChevronRight size={14} className="shrink-0 text-muted" aria-hidden /> : r.sub && <span className="shrink-0 text-[11.5px] text-muted">{r.sub}</span>}
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
        <div className={`mt-2 grid gap-2 ${withArea ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          <input value={district} onChange={(e) => onDistrict(e.target.value)} placeholder={labels.typeDistrict} maxLength={maxLength} aria-label={labels.district} className={controlClassName} />
          <input value={thana} onChange={(e) => onThana(e.target.value)} placeholder={labels.typeThana} maxLength={maxLength} aria-label={labels.thana} className={controlClassName} />
          {withArea && (
            <input value={area} onChange={(e) => onArea?.(e.target.value)} placeholder={labels.typeArea ?? areaLabel} maxLength={maxLength} aria-label={areaLabel} className={controlClassName} />
          )}
        </div>
      )}
      {thanaTyped && (
        <input value={thana} onChange={(e) => onThana(e.target.value)} placeholder={labels.typeThana} maxLength={maxLength} aria-label={labels.thana} className={`${controlClassName} mt-2`} />
      )}
      {areaTyped && !districtTyped && (
        <input value={area} onChange={(e) => onArea?.(e.target.value)} placeholder={labels.typeArea ?? areaLabel} maxLength={maxLength} aria-label={areaLabel} className={`${controlClassName} mt-2`} />
      )}
    </div>
  );
}
