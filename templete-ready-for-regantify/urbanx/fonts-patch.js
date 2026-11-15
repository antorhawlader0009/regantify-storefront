// Adds Permanent Marker (Urbanx's graffiti wordmark) to storefront/src/lib/fonts.ts. Barlow Condensed and Inter already exist there.
const fs = require('fs');
module.exports = function patchFonts(file) {
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('--font-graffiti')) return false;
  const nl = s.includes('\r\n') ? '\r\n' : '\n';
  s = s.replace('Cormorant_Garamond }', 'Cormorant_Garamond, Permanent_Marker }');
  const decl = "const permanentMarker = Permanent_Marker({ subsets: ['latin'], weight: '400', variable: '--font-graffiti', display: 'swap', preload: false });";
  s = s.replace(/export const fontVariables/, decl + nl + nl + 'export const fontVariables');
  s = s.replace('${cormorant.variable}', '${cormorant.variable} ${permanentMarker.variable}');
  if (!s.includes('${permanentMarker.variable}') || !s.includes('Permanent_Marker }')) throw new Error('fonts.ts patch did not apply');
  fs.writeFileSync(file, s);
  return true;
};
