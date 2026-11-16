// Adds Jost (Menaura's body font) to storefront/src/lib/fonts.ts. Cormorant Garamond already exists there.
const fs = require('fs');
module.exports = function patchFonts(file) {
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('--font-jost')) return false;
  const nl = s.includes('\r\n') ? '\r\n' : '\n';
  // add it after whichever font was imported last (other kits add theirs at the end, so no fixed name here)
  s = s.replace(/ \} from 'next\/font\/google'/, ", Jost } from 'next/font/google'");
  const decl = "const jost = Jost({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-jost', display: 'swap', preload: false });";
  s = s.replace(/export const fontVariables/, decl + nl + nl + 'export const fontVariables');
  s = s.replace('${cormorant.variable}', '${cormorant.variable} ${jost.variable}');
  if (!s.includes('${jost.variable}') || !s.includes('Jost }')) throw new Error('fonts.ts patch did not apply');
  fs.writeFileSync(file, s);
  return true;
};
