/**
 * Builds src/data/bdLocations.json, the district -> thana/upazila list StorePal's checkout and account
 * address form pick from (src/components/BdAddressPicker.tsx), from the open-source `@olism/bd-geo` package
 * (MIT; divisions, districts, upazilas and city thanas with Bangla names, maintained through 2026).
 *
 * The result is committed, so builds never depend on the npm registry. To pick up newer data:
 *
 *   npm install -D @olism/bd-geo@latest
 *   npm run locations:update
 *
 * then look at the diff and commit it. The script refuses to write a file that looks wrong (not 64
 * districts, a district with no thana, a missing Bangla name), so a bad upstream release can't slip in.
 *
 * Only districts and thanas/upazilas are kept. The package's unions, wards and villages are far from
 * complete (about 90 villages for a country with tens of thousands), so a dropdown for them would only
 * send shoppers to "Other"; the village or para goes in the address line instead.
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkgDir = join(root, 'node_modules', '@olism', 'bd-geo');
const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));

// The package's `exports` map points at files it doesn't ship, so load its CommonJS build by path.
const geo = createRequire(import.meta.url)(join(pkgDir, 'dist', 'index.cjs'));
const districts = geo.getDistricts();
const upazilas = geo.getUpazilas();

const fail = (message) => {
  console.error(`bd-locations: ${message}`);
  process.exit(1);
};

if (districts.length !== 64) fail(`expected 64 districts, got ${districts.length}`);

const byEnglish = (a, b) => a.name.localeCompare(b.name, 'en');
const out = {
  source: `@olism/bd-geo ${pkg.version}`,
  districts: districts.sort(byEnglish).map((d) => {
    if (!d.name || !d.nameBn) fail(`district ${d.id} has no name or Bangla name`);
    const thanas = upazilas
      .filter((u) => u.districtId === d.id)
      .sort(byEnglish)
      .map((u) => {
        if (!u.name || !u.nameBn) fail(`thana ${u.id} in ${d.name} has no name or Bangla name`);
        return [u.name.trim(), u.nameBn.trim()];
      });
    if (thanas.length === 0) fail(`district ${d.name} has no thanas or upazilas`);
    // A name can only appear once in a district, or the dropdown would show two identical rows.
    if (new Set(thanas.map((t) => t[0].toLowerCase())).size !== thanas.length) fail(`district ${d.name} repeats a thana name`);
    return { n: d.name.trim(), b: d.nameBn.trim(), t: thanas };
  }),
};

writeFileSync(join(root, 'src', 'data', 'bdLocations.json'), `${JSON.stringify(out)}\n`);
const total = out.districts.reduce((sum, d) => sum + d.t.length, 0);
console.log(`bd-locations: wrote ${out.districts.length} districts and ${total} thanas/upazilas from ${out.source}`);
