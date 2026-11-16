// Lists t('...') keys used in a theme folder that are missing from StorePal's BN table (a missing key shows English on a Bangla store).
// Usage (from storefront/src): node ../scripts/check-store-text.cjs . greenmart mallon
const fs = require('fs');
const path = require('path');
const root = process.argv[2];
const bn = fs.readFileSync(path.join(root, 'themes/storepal/lib/storeText.ts'), 'utf8');
const has = (k) => {
  const esc = k.replace(/'/g, "\\'");
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(k) && new RegExp('(^|[\\s,{])' + k + '\\s*:').test(bn)) return true;
  return bn.includes("'" + esc + "'") || bn.includes(JSON.stringify(k)) || bn.includes('`' + k + '`');
};
for (const t of process.argv.slice(3)) {
  const miss = new Set();
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (e.name !== 'demo') walk(p);
      } else if (/\.tsx?$/.test(e.name)) {
        const s = fs.readFileSync(p, 'utf8');
        for (const m of s.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'\s*[,)]/g)) {
          const k = m[1].replace(/\\'/g, "'");
          if (!has(k)) miss.add(k);
        }
      }
    }
  };
  walk(path.join(root, 'themes', t));
  console.log(t + ': ' + miss.size + ' missing', JSON.stringify([...miss].slice(0, 25)));
}
