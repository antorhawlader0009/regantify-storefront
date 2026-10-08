'use client';

import { useEffect, useId, useState } from 'react';
import { findDistrict, findThana, loadBdLocations, type BdLocations } from '@/lib/bdLocations';

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
}

interface Props {
  district: string;
  thana: string;
  onDistrict: (value: string) => void;
  onThana: (value: string) => void;
  /** Which language the dropdown rows are shown in. The value kept is always the English name. */
  lang: 'en' | 'bn';
  labels: BdAddressLabels;
  /** Classes of the surrounding theme, so the fields look native to it. */
  labelClassName: string;
  controlClassName: string;
  /** Wraps each field (the checkout's own grid cell). */
  fieldClassName?: string;
  maxLength?: number;
}

/**
 * District and thana/upazila as dropdowns for Bangladesh addresses (StorePal checkout, account address). Picking
 * from the list gives every order the same spelling, which is what courier booking, delivery reports and the
 * "Around Dhaka" zone suggestion work from; free text made "Chattogram", "Chittagong" and "ctg" three places.
 *
 * Nobody is ever stuck: the last row of each list is "Other (type it)", an old saved address that isn't in the
 * list shows as typed text, and if the list can't load both fields are plain text boxes like before. The village
 * or para goes in the address line: no open dataset has the country's villages, so a village dropdown would only
 * lead to "Other".
 *
 * The parent keeps `district` and `thana` as English text (what the order stores); this component only decides
 * what to show. Changing the district clears the thana.
 */
export function BdAddressPicker({ district, thana, onDistrict, onThana, lang, labels, labelClassName, controlClassName, fieldClassName, maxLength = 100 }: Props) {
  const [data, setData] = useState<BdLocations | 'failed' | null>(null);
  // "Other" picked on purpose, so the typed box can open while it is still empty.
  const [districtOther, setDistrictOther] = useState(false);
  const [thanaOther, setThanaOther] = useState(false);
  const districtId = useId();
  const thanaId = useId();

  useEffect(() => {
    let live = true;
    loadBdLocations()
      .then((loaded) => live && setData(loaded))
      .catch(() => live && setData('failed'));
    return () => {
      live = false;
    };
  }, []);

  const cell = fieldClassName ?? '';

  // List not loaded yet, or couldn't load: the same two text boxes the checkout always had.
  if (data === null || data === 'failed') {
    return (
      <>
        <div className={cell}>
          <label htmlFor={districtId} className={labelClassName}>{labels.district}</label>
          <input id={districtId} value={district} onChange={(e) => onDistrict(e.target.value)} placeholder={labels.typeDistrict} maxLength={maxLength} disabled={data === null} className={controlClassName} />
        </div>
        <div className={cell}>
          <label htmlFor={thanaId} className={labelClassName}>{labels.thana}</label>
          <input id={thanaId} value={thana} onChange={(e) => onThana(e.target.value)} placeholder={labels.typeThana} maxLength={maxLength} disabled={data === null} className={controlClassName} />
        </div>
      </>
    );
  }

  const shown = (pair: { n: string; b: string }) => (lang === 'bn' ? pair.b : pair.n);
  const matchedDistrict = findDistrict(data, district);
  const districtValue = matchedDistrict ? matchedDistrict.n : districtOther || district.trim() ? OTHER : '';

  const matchedThana = matchedDistrict ? findThana(matchedDistrict, thana) : null;
  const thanaValue = matchedThana ? matchedThana[0] : thanaOther || thana.trim() ? OTHER : '';

  const chooseDistrict = (value: string) => {
    if (value === matchedDistrict?.n) return;
    onThana('');
    setThanaOther(false);
    if (value === OTHER) {
      setDistrictOther(true);
      onDistrict('');
      return;
    }
    setDistrictOther(false);
    onDistrict(value);
  };

  const chooseThana = (value: string) => {
    if (value === OTHER) {
      setThanaOther(true);
      onThana('');
      return;
    }
    setThanaOther(false);
    onThana(value);
  };

  return (
    <>
      <div className={cell}>
        <label htmlFor={districtId} className={labelClassName}>{labels.district}</label>
        <select id={districtId} value={districtValue} onChange={(e) => chooseDistrict(e.target.value)} className={controlClassName}>
          <option value="">{labels.districtPlaceholder}</option>
          {data.districts.map((d) => (
            <option key={d.n} value={d.n}>{shown(d)}</option>
          ))}
          <option value={OTHER}>{labels.other}</option>
        </select>
        {districtValue === OTHER && (
          <input
            value={district}
            onChange={(e) => onDistrict(e.target.value)}
            placeholder={labels.typeDistrict}
            maxLength={maxLength}
            aria-label={labels.district}
            className={`${controlClassName} mt-2`}
          />
        )}
      </div>

      <div className={cell}>
        <label htmlFor={thanaId} className={labelClassName}>{labels.thana}</label>
        {matchedDistrict ? (
          <>
            <select id={thanaId} value={thanaValue} onChange={(e) => chooseThana(e.target.value)} className={controlClassName}>
              <option value="">{labels.thanaPlaceholder}</option>
              {matchedDistrict.t.map(([en, bn]) => (
                <option key={en} value={en}>{lang === 'bn' ? bn : en}</option>
              ))}
              <option value={OTHER}>{labels.other}</option>
            </select>
            {thanaValue === OTHER && (
              <input
                value={thana}
                onChange={(e) => onThana(e.target.value)}
                placeholder={labels.typeThana}
                maxLength={maxLength}
                aria-label={labels.thana}
                className={`${controlClassName} mt-2`}
              />
            )}
          </>
        ) : districtValue === OTHER ? (
          // A district that isn't in the list: the thana is typed too.
          <input id={thanaId} value={thana} onChange={(e) => onThana(e.target.value)} placeholder={labels.typeThana} maxLength={maxLength} className={controlClassName} />
        ) : (
          <select id={thanaId} disabled value="" onChange={() => undefined} className={`${controlClassName} opacity-60`}>
            <option value="">{labels.thanaNeedsDistrict}</option>
          </select>
        )}
      </div>
    </>
  );
}
