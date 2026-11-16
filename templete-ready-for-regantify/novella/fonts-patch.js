// Adds Manrope (Novella's font for everything) to storefront/src/lib/fonts.ts.
const fs = require('fs');
module.exports = function patchFonts(file) {
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('--font-manrope')) return false;
  const nl = s.includes('\r\n') ? '\r\n' : '\n';
  // add it after whichever font was imported last (other kits add theirs at the end, so no fixed name here)
  s = s.replace(/ \} from 'next\/font\/google'/, ", Manrope } from 'next/font/google'");
  const decl = "const manrope = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-manrope', display: 'swap', preload: false });";
  s = s.replace(/export const fontVariables/, decl + nl + nl + 'export const fontVariables');
  s = s.replace('${cormorant.variable}', '${cormorant.variable} ${manrope.variable}');
  if (!s.includes('${manrope.variable}') || !s.includes('Manrope }')) throw new Error('fonts.ts patch did not apply');
  fs.writeFileSync(file, s);
  return true;
};
