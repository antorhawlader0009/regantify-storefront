/**
 * A colour circle's fill from the option value's name ("Navy Blue", "লাল", "Off-white"), for a colour that has no photo.
 * English and Bangla names; the last word that is a colour wins ("Dark Green" -> dark green). Null = not a colour we know
 * (the circle then shows the value's first letter).
 */

const COLOURS: Record<string, string> = {
  black: '#111111', white: '#ffffff', 'off white': '#f4f1e8', offwhite: '#f4f1e8', cream: '#f3ead3', ivory: '#fffff0',
  grey: '#8a8d93', gray: '#8a8d93', silver: '#c0c0c0', ash: '#b2b4b6', charcoal: '#36454f',
  red: '#d32f2f', maroon: '#7b1e2b', burgundy: '#800020', wine: '#722f37', crimson: '#b71c3c',
  pink: '#ec7aa7', 'hot pink': '#ff3e9a', magenta: '#c2185b', peach: '#f6b799', coral: '#ff7f50',
  orange: '#f57c00', rust: '#b7410e', yellow: '#f9d43a', mustard: '#d8a31a', gold: '#d4af37', golden: '#d4af37',
  green: '#2e7d32', olive: '#708238', 'bottle green': '#05472a', mint: '#98e2c6', 'sea green': '#2e8b57', lime: '#9ccc65',
  teal: '#00897b', turquoise: '#30c5c0', cyan: '#26c6da',
  blue: '#1e63d6', navy: '#1b2a4a', 'navy blue': '#1b2a4a', 'sky blue': '#7ec8f0', 'royal blue': '#2a52be', denim: '#3b5b8a',
  purple: '#7b3fa0', violet: '#8f5bd6', lavender: '#b9a7e3', plum: '#8e4585',
  brown: '#6d4c41', chocolate: '#4e2a1e', coffee: '#6f4e37', tan: '#d2b48c', beige: '#e8dcc4', khaki: '#c3b091', camel: '#c19a6b',
  skin: '#e8c4a8', nude: '#e3bc9a',
  // Bangla
  'কালো': '#111111', 'সাদা': '#ffffff', 'লাল': '#d32f2f', 'নীল': '#1e63d6', 'সবুজ': '#2e7d32', 'হলুদ': '#f9d43a',
  'গোলাপি': '#ec7aa7', 'কমলা': '#f57c00', 'বেগুনি': '#7b3fa0', 'খয়েরি': '#6d4c41', 'বাদামি': '#6d4c41', 'ধূসর': '#8a8d93',
  'মেরুন': '#7b1e2b', 'আকাশি': '#7ec8f0', 'সোনালি': '#d4af37', 'রুপালি': '#c0c0c0',
};

export function swatchColor(value: string): string | null {
  const text = value.toLowerCase().replace(/[-_/]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (COLOURS[text]) return COLOURS[text];
  const words = text.split(' ');
  // Two-word names first ("navy blue", "sky blue"), then single words from the end.
  for (let i = words.length - 2; i >= 0; i--) {
    const pair = `${words[i]} ${words[i + 1]}`;
    if (COLOURS[pair]) return COLOURS[pair];
  }
  for (let i = words.length - 1; i >= 0; i--) {
    if (COLOURS[words[i]]) return COLOURS[words[i]];
  }
  return null;
}
