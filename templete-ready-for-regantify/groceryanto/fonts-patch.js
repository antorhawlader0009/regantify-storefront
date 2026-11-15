// Adds Instrument Sans (body) and Jost (headings), Groceryanto's two fonts, to storefront/src/lib/fonts.ts.
const fs = require('fs');
module.exports = function patchFonts(file) {
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('--font-instrument')) return false;
  const nl = s.includes('\r\n') ? '\r\n' : '\n';
  s = s.replace('Cormorant_Garamond }', 'Cormorant_Garamond, Instrument_Sans, Jost }');
  const decl =
    "const instrumentSans = Instrument_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-instrument', display: 'swap', preload: false });" +
    nl +
    "const jost = Jost({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-jost', display: 'swap', preload: false });";
  s = s.replace(/export const fontVariables/, decl + nl + nl + 'export const fontVariables');
  s = s.replace('${cormorant.variable}', '${cormorant.variable} ${instrumentSans.variable} ${jost.variable}');
  if (!s.includes('${jost.variable}') || !s.includes('Instrument_Sans, Jost }')) throw new Error('fonts.ts patch did not apply');
  fs.writeFileSync(file, s);
  return true;
};
