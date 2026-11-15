// Adds Roboto Condensed (Drivecraft's heading font, bold and italic) to storefront/src/lib/fonts.ts. Inter already exists there.
const fs = require('fs');
module.exports = function patchFonts(file) {
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('--font-roboto-cond')) return false;
  const nl = s.includes('\r\n') ? '\r\n' : '\n';
  s = s.replace('Cormorant_Garamond }', 'Cormorant_Garamond, Roboto_Condensed }');
  const decl = "const robotoCondensed = Roboto_Condensed({ subsets: ['latin'], weight: ['400', '700'], style: ['normal', 'italic'], variable: '--font-roboto-cond', display: 'swap', preload: false });";
  s = s.replace(/export const fontVariables/, decl + nl + nl + 'export const fontVariables');
  s = s.replace('${cormorant.variable}', '${cormorant.variable} ${robotoCondensed.variable}');
  if (!s.includes('${robotoCondensed.variable}') || !s.includes('Roboto_Condensed }')) throw new Error('fonts.ts patch did not apply');
  fs.writeFileSync(file, s);
  return true;
};
