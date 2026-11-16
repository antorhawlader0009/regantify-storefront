// Adds Plus Jakarta Sans (Furnilux's font for everything) to storefront/src/lib/fonts.ts.
const fs = require('fs');
module.exports = function patchFonts(file) {
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('--font-jakarta')) return false;
  const nl = s.includes('\r\n') ? '\r\n' : '\n';
  // add it after whichever font was imported last (other kits add theirs at the end, so no fixed name here)
  s = s.replace(/ \} from 'next\/font\/google'/, ", Plus_Jakarta_Sans } from 'next/font/google'");
  const decl = "const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-jakarta', display: 'swap', preload: false });";
  s = s.replace(/export const fontVariables/, decl + nl + nl + 'export const fontVariables');
  s = s.replace('${cormorant.variable}', '${cormorant.variable} ${plusJakarta.variable}');
  if (!s.includes('${plusJakarta.variable}') || !s.includes('Plus_Jakarta_Sans }')) throw new Error('fonts.ts patch did not apply');
  fs.writeFileSync(file, s);
  return true;
};
