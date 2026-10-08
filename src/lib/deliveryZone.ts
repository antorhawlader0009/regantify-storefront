/**
 * Store > Delivery Charge > "Around Dhaka": which of the three delivery zones a typed address belongs to.
 * Only a suggestion for StorePal's checkout, applied while the shopper has not picked a zone themselves;
 * the server prices whatever zone the order is sent with. District and Thana/Upazila are free text, so
 * this matches common English and Bangla spellings and never guesses on an empty or unknown address.
 */
export type SuggestedZone = 'DHAKA' | 'AROUND_DHAKA' | 'OUTSIDE_DHAKA';

// Whole districts that sit next to Dhaka and are priced as "around".
const AROUND_DISTRICTS = ['gazipur', 'narayanganj', 'narayangonj', 'গাজীপুর', 'নারায়ণগঞ্জ'];

// Thanas / upazilas of Dhaka district itself (and Tongi, often typed without the district) that couriers price as "around".
const AROUND_THANAS = [
  'savar', 'সাভার', 'ashulia', 'ashullia', 'আশুলিয়া', 'keraniganj', 'keranigonj', 'কেরানীগঞ্জ',
  'dohar', 'দোহার', 'nawabganj', 'নবাবগঞ্জ', 'dhamrai', 'ধামরাই', 'tongi', 'টঙ্গী', 'gazipur', 'narayanganj',
];

const DHAKA_WORDS = ['dhaka', 'dacca', 'ঢাকা'];

function has(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

/** The zone this district + thana suggests, or null when there is nothing to go on yet. */
export function suggestZone(district: string, thana: string): SuggestedZone | null {
  const d = district.trim().toLowerCase();
  const t = thana.trim().toLowerCase();
  if (!d && !t) return null;

  if (has(d, AROUND_DISTRICTS)) return 'AROUND_DHAKA';
  // Dhaka district: the thana decides (Savar, Keraniganj... are "around", the city is "inside").
  if (has(d, DHAKA_WORDS) || (!d && has(t, DHAKA_WORDS))) return has(t, AROUND_THANAS) ? 'AROUND_DHAKA' : 'DHAKA';
  // A thana alone that is clearly an around-Dhaka area.
  if (!d && has(t, AROUND_THANAS)) return 'AROUND_DHAKA';
  // A district that is not Dhaka or next to it.
  return d ? 'OUTSIDE_DHAKA' : null;
}
