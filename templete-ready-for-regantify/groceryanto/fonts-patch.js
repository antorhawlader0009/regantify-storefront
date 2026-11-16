// Adds Instrument Sans (body) and Jost (headings), Groceryanto's two fonts, to storefront/src/lib/fonts.ts.
const fs = require('fs');
module.exports = function patchFonts(file) {
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('--font-instrument')) return false;
  const nl = s.includes('\r\n') ? '\r\n' : '\n';
  // add them after whichever font was imported last (other kits add theirs at the end, so no fixed name here)
  s = s.replace(/ \} from 'next\/font\/google'/, ", Instrument_Sans, Jost } from 'next/font/google'");
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
