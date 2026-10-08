/**
 * Bangladesh districts and their thanas / upazilas, for StorePal's address pickers (BdAddressPicker). The data
 * (src/data/bdLocations.json) is built from the open-source @olism/bd-geo package by
 * `npm run locations:update`, see scripts/build-bd-locations.mjs. English names are what an order stores, so the
 * vendor's dashboard, the courier matching and the delivery reports all see one spelling.
 */

/** A district: English name, Bangla name, and its thanas/upazilas as [English, Bangla] pairs. */
export interface BdDistrict {
  n: string;
  b: string;
  t: [string, string][];
}

export interface BdLocations {
  source: string;
  districts: BdDistrict[];
}

let cached: Promise<BdLocations> | null = null;

/** The list, loaded on first use as its own chunk so it never weighs down the store's first page. */
export function loadBdLocations(): Promise<BdLocations> {
  if (!cached) {
    cached = import('@/data/bdLocations.json').then((m) => m.default as BdLocations);
    // A failed load is tried again next time instead of staying failed for the whole visit.
    cached.catch(() => {
      cached = null;
    });
  }
  return cached;
}

/** Lower-cased letters only (English and Bangla), so "Cox's Bazar", "coxs bazar" and "COXSBAZAR" compare equal. */
export function normalizeName(text: string): string {
  return text.toLowerCase().replace(/[^a-zঀ-৿]/g, '');
}

// Spellings people (and older lists) use for a district, mapped to the name this data uses.
const DISTRICT_ALIASES: Record<string, string> = {
  chittagong: 'Chattogram',
  comilla: 'Cumilla',
  barisal: 'Barishal',
  bogra: 'Bogura',
  jashore: 'Jessore',
  jhalakathi: 'Jhalokati',
  jhalakati: 'Jhalokati',
  jhalokathi: 'Jhalokati',
  coxsbazar: "Cox's Bazar",
  coxbazar: "Cox's Bazar",
  chapainawabganj: 'Chapainawabganj',
  nawabganjchapai: 'Chapainawabganj',
  khagrachhari: 'Khagrachari',
  khagrachori: 'Khagrachari',
  netrakona: 'Netrokona',
  maulvibazar: 'Moulvibazar',
  jaipurhat: 'Joypurhat',
  laxmipur: 'Lakshmipur',
  kishorganj: 'Kishoreganj',
  munshigonj: 'Munshiganj',
  narayangonj: 'Narayanganj',
  narshingdi: 'Narsingdi',
  sirajgonj: 'Sirajganj',
  mymensing: 'Mymensingh',
  dacca: 'Dhaka',
};

/** The district a typed or saved text stands for (any case, English or Bangla, common alternate spellings), or null. */
export function findDistrict(data: BdLocations, text: string): BdDistrict | null {
  const key = normalizeName(text);
  if (!key) return null;
  const direct = data.districts.find((d) => normalizeName(d.n) === key || normalizeName(d.b) === key);
  if (direct) return direct;
  const alias = DISTRICT_ALIASES[key];
  return alias ? (data.districts.find((d) => d.n === alias) ?? null) : null;
}

/** The thana/upazila of a district that a text stands for, or null. */
export function findThana(district: BdDistrict, text: string): [string, string] | null {
  const key = normalizeName(text);
  if (!key) return null;
  return district.t.find((t) => normalizeName(t[0]) === key || normalizeName(t[1]) === key) ?? null;
}
