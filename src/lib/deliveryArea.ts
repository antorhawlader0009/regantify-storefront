/*
 * Delivery area control (TellMe idea 65). Plain functions with no Nest or Prisma import, used by OrdersService.create.
 * District names are matched by letters only, with the common alternative spellings folded together, because the
 * dashboard's list and the storefront's address picker do not always spell a district the same way.
 */

export type DeliveryAreaMode = 'OFF' | 'ONLY' | 'EXCEPT';

const ALIASES: Record<string, string> = {
  chittagong: 'chattogram',
  comilla: 'cumilla',
  barisal: 'barishal',
  bogra: 'bogura',
  jessore: 'jashore',
  jhalakathi: 'jhalokati',
  jhalakati: 'jhalokati',
  maulvibazar: 'moulvibazar',
  netrokona: 'netrakona',
  nawabganj: 'chapainawabganj',
  chapainababganj: 'chapainawabganj',
  khagrachari: 'khagrachhari',
  laksmipur: 'lakshmipur',
  munshigonj: 'munshiganj',
  narshingdi: 'narsingdi',
  sirajgonj: 'sirajganj',
  hobiganj: 'habiganj',
  coxsbazar: 'coxsbazar',
  cox: 'coxsbazar',
  brahmanbaria: 'brahmanbaria',
  brahmanbaira: 'brahmanbaria',
  naogaon: 'naogaon',
  nowgaon: 'naogaon',
  pabna: 'pabna',
  thakurgaon: 'thakurgaon',
  panchagarh: 'panchagarh',
  panchagar: 'panchagarh',
};

/** One key per district: lower-case letters only, alias spellings folded to one. */
export function areaKey(name: string | null | undefined): string {
  const key = (name ?? '').toLowerCase().replace(/[^a-z\u0980-\u09ff]/g, '');
  return ALIASES[key] ?? key;
}

/**
 * Why a district cannot be delivered to, or null when it can. ONLY: the district must be in the list (and must be given).
 * EXCEPT: it must not be. OFF: always fine. An empty district only blocks in ONLY mode (nothing to match against).
 */
export function deliveryAreaRefusal(
  mode: string,
  districts: string[],
  district: string | null | undefined,
  message: string | null | undefined,
): string | null {
  if (mode !== 'ONLY' && mode !== 'EXCEPT') return null;
  const key = areaKey(district);
  const listed = key !== '' && districts.some((d) => areaKey(d) === key);
  const blocked = mode === 'ONLY' ? !listed : listed;
  if (!blocked) return null;
  return message?.trim() || 'Sorry, we do not deliver to this district right now.';
}
