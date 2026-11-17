// Adds Orbitron (Sporteq's wordmark font) to storefront/src/lib/fonts.ts. DM Sans already exists there.
const fs = require('fs');
module.exports = function patchFonts(file) {
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('--font-orbitron')) return false;
  const nl = s.includes('\r\n') ? '\r\n' : '\n';
  // add it after whichever font was imported last (other kits add theirs at the end, so no fixed name here)
  s = s.replace(/ \} from 'next\/font\/google'/, ", Orbitron } from 'next/font/google'");
  const decl = "const orbitron = Orbitron({ subsets: ['latin'], weight: ['800', '900'], variable: '--font-orbitron', display: 'swap', preload: false });";
  s = s.replace(/export const fontVariables/, decl + nl + nl + 'export const fontVariables');
  s = s.replace('${cormorant.variable}', '${cormorant.variable} ${orbitron.variable}');
  if (!s.includes('${orbitron.variable}') || !s.includes(", Orbitron } from 'next/font/google'")) throw new Error('fonts.ts patch did not apply');
  fs.writeFileSync(file, s);
  return true;
};
