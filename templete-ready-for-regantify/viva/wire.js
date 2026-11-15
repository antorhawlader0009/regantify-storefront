// Wires the Viva template into Regantify in one run.  Usage:  node wire.js [workspaceRoot]
// It copies the theme files, appends the CSS block, adds the enum + migration, and adds an `viva` branch next to every
// `chicwove` one in the shared server / client / storefront files (the same pattern the guide describes, done by script).
// Safe to rerun: a file that already mentions VIVA / viva is skipped.  Nothing is committed.
const fs = require('fs');
const path = require('path');

const ROOT = (process.argv[2] || 'D:/AAA Office/Regantify').replace(/\\/g, '/');
const KIT = __dirname.replace(/\\/g, '/');
const SN = (f) => fs.readFileSync(`${KIT}/snippets/${f}`, 'utf8').replace(/\r?\n$/, '');

const ren = (s) =>
  s
    .replace(/Chicwove/g, 'Viva')
    .replace(/chicwove/g, 'viva')
    .replace(/CHICWOVE/g, 'VIVA')
    .replace(/\bcw-/g, 'vv-')
    .replace(/--cw-/g, '--vv-')
    .replace(/\bCw([A-Z])/g, 'Vv$1');

const report = [];
const log = (m) => report.push(m);

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = `${from}/${e.name}`;
    const b = `${to}/${e.name}`;
    if (e.isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

// ---- 1. copy files ---------------------------------------------------------------------------------------------------
const SF = `${ROOT}/storefront/src`;
copyDir(`${KIT}/storefront/themes/viva`, `${SF}/themes/viva`);
fs.mkdirSync(`${SF}/app/store/[subdomain]/template-demo/viva`, { recursive: true });
fs.copyFileSync(`${KIT}/storefront/route-template-demo-viva/page.tsx`, `${SF}/app/store/[subdomain]/template-demo/viva/page.tsx`);
const css = `${SF}/app/globals.css`;
let cssText = fs.readFileSync(css, 'utf8');
if (!cssText.includes("data-skin='viva'")) {
  fs.writeFileSync(css, cssText.replace(/\s*$/, '\n\n') + fs.readFileSync(`${KIT}/storefront/globals.css.block`, 'utf8').replace(/\s*$/, '\n'));
  log('globals.css: block appended');
}

// ---- 2. server enum + migration --------------------------------------------------------------------------------------
const schemaPath = `${ROOT}/server/prisma/schema.prisma`;
let schema = fs.readFileSync(schemaPath, 'utf8');
if (!/enum StoreTheme \{[^}]*\bVIVA\b/.test(schema)) {
  const nl = schema.includes('\r\n') ? '\r\n' : '\n';
  schema = schema.replace(/(enum StoreTheme \{[\s\S]*?)(\r?\n\})/, `$1${nl}  // A fresh marketplace look (cream page with white rounded panels, forest green buttons and footer, sage and coral accents, Fraunces headings over Inter) on StorePal's own code, same family as PLAYMATE.${nl}  VIVA$2`);
  fs.writeFileSync(schemaPath, schema);
  log('schema.prisma: VIVA added to StoreTheme');
}
const migDir = `${ROOT}/server/prisma/migrations`;
if (!fs.readdirSync(migDir).some((d) => d.endsWith('_viva_theme'))) {
  const newest = fs.readdirSync(migDir).filter((d) => /^\d{14}_/.test(d)).map((d) => d.slice(0, 14)).sort().pop();
  const d = new Date(Date.UTC(+newest.slice(0, 4), +newest.slice(4, 6) - 1, +newest.slice(6, 8), 10, 0, 0) + 86400000);
  const p2 = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getUTCFullYear()}${p2(d.getUTCMonth() + 1)}${p2(d.getUTCDate())}100000`;
  fs.mkdirSync(`${migDir}/${stamp}_viva_theme`);
  fs.copyFileSync(`${KIT}/server/migration.sql`, `${migDir}/${stamp}_viva_theme/migration.sql`);
  log(`migration ${stamp}_viva_theme created (still has to be applied: local, then production)`);
}

// ---- 3. shared files -------------------------------------------------------------------------------------------------
const FILES = [
  'server/src/admin/admin-vendor-list.controller.ts',
  'server/src/common/storepal-family.ts',
  'server/src/photo-match/photo-match.service.ts',
  'server/src/plans/plan-limits.service.ts',
  'server/src/vendor/dto/update-theme.dto.ts',
  'client/src/lib/storefrontApi.ts',
  'client/src/lib/vendorApi.ts',
  'client/src/pages/admin/vendors/VendorListPage.tsx',
  'client/src/pages/vendor/ai-usage/AiUsage.tsx',
  'client/src/pages/vendor/store/Themes.tsx',
  'storefront/src/lib/storefrontApi.ts',
  'storefront/src/lib/theme.ts',
  'storefront/src/app/store/[subdomain]/cart/page.tsx',
  'storefront/src/app/store/[subdomain]/product/[slug]/page.tsx',
  'storefront/src/app/store/[subdomain]/products/page.tsx',
  'storefront/src/app/store/[subdomain]/wishlist/page.tsx',
  'storefront/src/themes/playmate/SkinPage.tsx',
  'storefront/src/themes/storepal/components/AccountLayout.tsx',
  'storefront/src/themes/storepal/components/AuthDialog.tsx',
  'storefront/src/themes/storepal/components/LanguageSwitch.tsx',
  'storefront/src/themes/storepal/components/ProductCard.tsx',
  'storefront/src/themes/storepal/components/StoreDialogFrame.tsx',
  'storefront/src/themes/storepal/components/StoreFooter.tsx',
  'storefront/src/themes/storepal/components/StoreHeader.tsx',
  'storefront/src/themes/storepal/components/StorePalProductPanel.tsx',
  'storefront/src/themes/storepal/components/StorePalProductTabs.tsx',
  'storefront/src/themes/storepal/lib/homeSections.ts',
  'storefront/src/themes/storepal/views/CheckoutView.tsx',
  'storefront/src/themes/storepal/views/HomeView.tsx',
];

const isComment = (l) => /^\s*(\/\/|\/\*|\*)/.test(l);
const TERN = /((?:\w+|storeSkin\([^)]*\)) === '(?:chicwove|CHICWOVE)' \? )([^:?]+?)( : )/g;
const CHAIN = /(\w+ (?:===|!==) '(?:CHICWOVE|chicwove)' (?:\|\||&&) )/g;
const LIST = /'(CHICWOVE|chicwove)'(,| \|) /g;

function findEnd(lines, start, endRe) {
  for (let j = start + 1; j < lines.length; j++) if (endRe.test(lines[j])) return j;
  throw new Error('block end not found after line ' + (start + 1));
}

function footerBlockFix(block) {
  // the footer is dark green and re-points colour variables, so the call bar uses fixed colours: a green band with white buttons
  const rep = (str, from, to) => str.split(from).join(to);
  let out = block;
  out = rep(out, 'rounded-3xl bg-gradient-to-r from-[#EE5A52] to-[#F27A6F]', 'rounded-2xl bg-[#124a39]');
  out = rep(out, 'hover:bg-[var(--vv-cream)]', 'hover:bg-[#d9e1b5] hover:text-[#082a20]');
  out = rep(out, 'hover:text-ink', 'hover:text-[#082a20]');
  out = rep(out, 'text-ink', 'text-[#082a20]');
  out = rep(out, 'rounded-lg', 'rounded');
  out = rep(out, 'text-sm font-semibold', 'text-[11px] font-semibold');
  out = rep(out, 'text-sm font-medium', 'text-[11px] font-semibold');
  out = rep(out, 'font-bold sm:text-2xl', 'font-extrabold sm:text-2xl');
  return out;
}

for (const rel of FILES) {
  const file = `${ROOT}/${rel}`;
  const raw = fs.readFileSync(file, 'utf8');
  if (/viva/i.test(raw)) {
    log(`skip (already has viva): ${rel}`);
    continue;
  }
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  const out = [];
  let n = 0;
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    if (!/chicwove/i.test(L) || isComment(L)) {
      // plan-limits: a new template goes last in THEME_ORDER (just before the spread of the remaining themes), so the others keep their plan.
      if (rel.endsWith('plan-limits.service.ts') && L.trim().startsWith('...Object.values(StoreTheme)')) {
        out.push('  StoreTheme.VIVA,', L);
        n++;
        continue;
      }
      out.push(L);
      continue;
    }
    // multi-line `if (skin === 'chicwove') {` ... `}`
    if (/^\s*if \((skin|look) === 'chicwove'\) \{\s*$/.test(L)) {
      const indent = L.match(/^\s*/)[0];
      const end = findEnd(lines, i, new RegExp('^' + indent + '\\}\\s*$'));
      const block = lines.slice(i, end + 1);
      let copy = ren(block.join(eol));
      if (rel.endsWith('StoreFooter.tsx')) copy = footerBlockFix(copy);
      out.push(...block, ...copy.split(eol));
      i = end;
      n++;
      continue;
    }
    // multi-line JSX ternary on the product page
    if (/^\s*\) : storeSkin\(store\.theme\) === 'chicwove' \? \($/.test(L)) {
      let end = i + 1;
      while (!/^\s*\) : /.test(lines[end])) end++;
      const block = lines.slice(i, end);
      out.push(...block, ...ren(block.join(eol)).split(eol));
      i = end - 1;
      n++;
      continue;
    }
    // HomeView: `: skin === 'chicwove'` + next line `? {...}`
    if (/^\s*: skin === 'chicwove'\s*$/.test(L)) {
      const block = [L, lines[i + 1]];
      out.push(...block, ...ren(block.join(eol)).split(eol));
      i += 1;
      n++;
      continue;
    }
    // LanguageSwitch function / home section order: copy from the snippets after the Chicwove one
    if (/^export function ChicwoveLanguageSwitch/.test(L)) {
      const end = findEnd(lines, i, /^\}\s*$/);
      out.push(...lines.slice(i, end + 1), '', ...SN('LanguageSwitch.viva.tsx.txt').split(/\r?\n/));
      i = end;
      n++;
      continue;
    }
    if (/^export const CHICWOVE_ORDER/.test(L)) {
      const end = findEnd(lines, i, /^\];\s*$/);
      out.push(...lines.slice(i, end + 1), '', ...SN('homeSections.viva.ts.txt').split(/\r?\n/));
      i = end;
      n++;
      continue;
    }
    // Themes page: the card entry and the preview drawing
    if (/^\s*id: 'CHICWOVE',\s*$/.test(L) && out[out.length - 1].trim() === '{') {
      const brace = out.pop();
      out.push(...SN('themes-entry.txt').split(/\r?\n/), brace, L);
      n++;
      continue;
    }
    if (/^\s*if \(id === 'CHICWOVE'\) \{\s*$/.test(L)) {
      out.push(...SN('themes-preview.txt').split(/\r?\n/), L);
      n++;
      continue;
    }
    if (/^\s*name: 'Chicwove',\s*$/.test(L)) {
      out.push(L);
      continue;
    }
    // no THEME_CATEGORIES line: a general template shows under Others only
    if (/^\s*CHICWOVE: \[/.test(L)) {
      out.push(L);
      continue;
    }
    // one-line branches, imports, map entries and <option>
    if ((/^\s*if \(.*\) return .*;\s*$/.test(L)) || /^\s*import /.test(L) && !/CHICWOVE_ORDER/.test(L) || /^\s*CHICWOVE: /.test(L) || /<option value="CHICWOVE"/.test(L)) {
      out.push(L, ren(L));
      n++;
      continue;
    }
    if (/^\s*StoreTheme\.CHICWOVE,\s*$/.test(L)) {
      out.push(L); // Viva's place in THEME_ORDER is added after ELEVATE
      continue;
    }
    // inline additions inside a longer line
    let M = L;
    M = M.replace(TERN, (m) => ren(m) + m);
    M = M.replace(CHAIN, (m) => m + ren(m));
    M = M.replace(/(t !== StoreTheme\.CHICWOVE && )/g, (m) => m + ren(m));
    M = M.replace(LIST, (m, a, b) => `'${a}'${b} ${ren("'" + a + "'")}${b} `);
    M = M.replace(/CHICWOVE_ORDER, /, 'CHICWOVE_ORDER, VIVA_ORDER, ');
    if (rel.endsWith('HomeView.tsx')) M = M.split("skin === 'viva' ? t('New Arrivals')").join("skin === 'viva' ? t('Trending Products')");
    if (M === L) log(`  !! line left alone (check by hand): ${rel}:${i + 1}: ${L.trim().slice(0, 100)}`);
    else n++;
    out.push(M);
  }
  fs.writeFileSync(file, out.join(eol));
  log(`${rel}: ${n} edits`);
}

console.log(report.join('\n'));
console.log('\nNext: cd server && npx prisma generate (stop the API first if EPERM) && npx prisma migrate deploy; then production migrate through the tunnel; then tsc in server, client (tsc -b), storefront.');
