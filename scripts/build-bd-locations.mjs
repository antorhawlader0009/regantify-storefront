/**
 * Builds src/data/bdLocations.json, the district -> thana/upazila -> area list StorePal's address pickers use
 * (src/components/BdAddressPicker.tsx, shown as "City › Zone › Area"). Two open-source packages, both MIT:
 *
 * - `@olism/bd-geo`: the 64 districts and 531 thanas/upazilas (city thanas included) with Bangla names, plus city
 *   areas (wards such as "Mirpur-10" or "Uttara Sector 4") for about 117 thanas.
 * - `bangladesh-location-data` (github.com/sohan-99/bangladesh-location-data): about 4,500 unions with Bangla names,
 *   added as the areas of the upazila they belong to. Its upazila names are spelled a little differently
 *   ("Bogra Sadar", "Pathorghata"), so they are matched by a forgiving name compare (see matchUpazila).
 *
 * The result is committed, so builds never depend on the npm registry. To pick up newer data:
 *
 *   npm install -D @olism/bd-geo@latest bangladesh-location-data@latest
 *   npm run locations:update
 *
 * then look at the diff and commit it. The script refuses to write a file that looks wrong (not 64 districts, a
 * district with no thana, a missing Bangla name, far fewer areas than expected), so a bad release can't slip in.
 * Villages are left out (no open list is anywhere near complete); the village or para goes in the address line,
 * and every list has "Other (type it)".
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkgDir = join(root, 'node_modules', '@olism', 'bd-geo');
const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
const unionDir = join(root, 'node_modules', 'bangladesh-location-data');
const unionPkg = JSON.parse(readFileSync(join(unionDir, 'package.json'), 'utf8'));
const unionEn = JSON.parse(readFileSync(join(unionDir, 'locationBdDivisonsToUnionsEnglish.json'), 'utf8'));
const unionBn = JSON.parse(readFileSync(join(unionDir, 'locationBdDivisonsToUnionsBangla.json'), 'utf8'));

// The package's `exports` map points at files it doesn't ship, so load its CommonJS build by path.
const geo = createRequire(import.meta.url)(join(pkgDir, 'dist', 'index.cjs'));
const districts = geo.getDistricts();
const upazilas = geo.getUpazilas();
const areas = geo.getAreas();

const fail = (message) => {
  console.error(`bd-locations: ${message}`);
  process.exit(1);
};

if (districts.length !== 64) fail(`expected 64 districts, got ${districts.length}`);

// ---- Matching the union package's names to ours --------------------------------------------------------------

/** Letters only, lower case, with the spelling differences seen between the two lists folded together. */
const fold = (s) =>
  s
    .toLowerCase()
    .replace(/sadar|upazila|thana/g, '')
    .replace(/[^a-z]/g, '')
    .replace(/sh/g, 's')
    .replace(/[aeiouy]+/g, '')
    .replace(/(.)\1+/g, '$1');

const DISTRICT_ALIASES = { chittagong: 'chattogram', comilla: 'cumilla', barisal: 'barishal', bogra: 'bogura', jashore: 'jessore', jhalakathi: 'jhalokati', khagrachhari: 'khagrachari', netrakona: 'netrokona', maulvibazar: 'moulvibazar', nawabganj: 'chapainawabganj' };
const plain = (s) => s.toLowerCase().replace(/[^a-z]/g, '');

function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const keep = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = keep;
    }
  }
  return row[b.length];
}

const theirDistricts = Object.values(unionEn.districts_en).flat();
function theirDistrict(name) {
  const key = plain(name);
  return theirDistricts.find((d) => plain(d.title) === key || DISTRICT_ALIASES[plain(d.title)] === key) ?? null;
}

/** Their upazila for one of ours: same letters, else the same consonants, else one closest by a small edit, never two. */
function matchUpazila(ourName, theirs) {
  const exact = theirs.filter((u) => plain(u.title) === plain(ourName));
  if (exact.length === 1) return exact[0];
  const folded = theirs.filter((u) => fold(u.title) === fold(ourName));
  if (folded.length === 1) return folded[0];
  const scored = theirs.map((u) => ({ u, d: editDistance(fold(u.title), fold(ourName)) })).sort((a, b) => a.d - b.d);
  if (scored.length && scored[0].d <= 1 && fold(ourName).length >= 4 && (scored.length === 1 || scored[1].d > scored[0].d)) return scored[0].u;
  return null;
}

const unionsBnById = new Map(Object.values(unionBn.unions_bn).flat().map((u) => [String(u.value), String(u.title)]));

// ---- Building the file ---------------------------------------------------------------------------------------

const byEnglish = (a, b) => a.name.localeCompare(b.name, 'en');
let matchedUpazilas = 0;
let unionsAdded = 0;
const out = {
  source: `@olism/bd-geo ${pkg.version}, bangladesh-location-data ${unionPkg.version}`,
  districts: districts.sort(byEnglish).map((d) => {
    if (!d.name || !d.nameBn) fail(`district ${d.id} has no name or Bangla name`);
    const theirD = theirDistrict(d.name);
    if (!theirD) fail(`district ${d.name} is not in bangladesh-location-data`);
    const theirUpazilas = unionEn.upazilas_en[String(theirD.value)] ?? [];
    const thanas = upazilas
      .filter((u) => u.districtId === d.id)
      .sort(byEnglish)
      .map((u) => {
        if (!u.name || !u.nameBn) fail(`thana ${u.id} in ${d.name} has no name or Bangla name`);
        // City areas first (bd-geo), then the upazila's unions; each name once, sorted. A name without Bangla shows its English one.
        const list = areas.filter((a) => a.upazilaId === u.id && a.name && a.name.trim()).map((a) => [a.name.trim(), (a.nameBn || a.name).trim()]);
        const theirU = matchUpazila(u.name, theirUpazilas);
        if (theirU) {
          matchedUpazilas++;
          for (const un of unionEn.unions_en[String(theirU.value)] ?? []) {
            const name = String(un.title ?? '').trim();
            if (!name) continue;
            list.push([name, (unionsBnById.get(String(un.value)) || name).trim()]);
            unionsAdded++;
          }
        }
        const seen = new Set();
        const own = list
          .filter((a) => {
            const key = a[0].toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .sort((a, b) => a[0].localeCompare(b[0], 'en', { numeric: true }));
        return own.length ? [u.name.trim(), u.nameBn.trim(), own] : [u.name.trim(), u.nameBn.trim()];
      });
    if (thanas.length === 0) fail(`district ${d.name} has no thanas or upazilas`);
    // A name can only appear once in a district, or the dropdown would show two identical rows.
    if (new Set(thanas.map((t) => t[0].toLowerCase())).size !== thanas.length) fail(`district ${d.name} repeats a thana name`);
    return { n: d.name.trim(), b: d.nameBn.trim(), t: thanas };
  }),
};

if (unionsAdded < 3500) fail(`only ${unionsAdded} unions matched; the union package or the matching looks wrong`);

writeFileSync(join(root, 'src', 'data', 'bdLocations.json'), `${JSON.stringify(out)}\n`);
const total = out.districts.reduce((sum, d) => sum + d.t.length, 0);
const withAreas = out.districts.reduce((sum, d) => sum + d.t.filter((t) => t[2]).length, 0);
const areaCount = out.districts.reduce((sum, d) => sum + d.t.reduce((s, t) => s + (t[2]?.length ?? 0), 0), 0);
console.log(
  `bd-locations: wrote ${out.districts.length} districts, ${total} thanas/upazilas (${withAreas} with areas, ${areaCount} areas; ` +
    `${matchedUpazilas} upazilas matched to ${unionsAdded} unions) from ${out.source}`,
);
