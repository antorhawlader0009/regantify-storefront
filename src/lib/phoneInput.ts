/*
 * Phone boxes always show English digits (IDEA-18). A shopper on a Bangla keyboard who types ০১৭১২৩৪৫৬৭৮ sees 01712345678 appear in
 * the box, and a number pasted as +8801712345678, 8801712345678 or "017 1234-5678" becomes 01712345678. Shared by every template; each
 * phone box runs its typed value through `phoneInput` in its onChange, so what is stored, validated and sent is already the local form.
 *
 * The same rules are copied by hand in the server (server/src/lms/lms-phone.ts, `toLocalBdPhone`) for numbers that arrive without
 * this box (the API, imports); this file only tidies what is typed.
 */

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

/** Bangla digits (০-৯) turned into 0-9; every other character stays as it is. */
export function latinDigits(value: string): string {
  return value.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

/**
 * A typed or pasted phone number as a Bangladeshi local number. Bangla digits become English, spaces, dashes, dots and brackets go, and a
 * +880 / 880 prefix (+88 / 88 in front of the 01) is cut off once the 01 after it is typed, so a half-typed "+88" is left alone while the
 * shopper is still typing it. Anything that is not a number (letters) is kept so the box never eats what was typed.
 */
export function phoneInput(value: string): string {
  const s = latinDigits(value).replace(/[\s\-.()​-‍﻿]/g, '');
  const m = /^\+?88(01.*)$/.exec(s);
  return m ? m[1] : s;
}

/**
 * For a box that takes an email or a phone number (the login box): Bangla digits always become English; the phone clean-up (spaces,
 * +880) runs only when the text looks like a number, so an email address is never touched beyond its digits.
 */
export function emailOrPhoneInput(value: string): string {
  const s = latinDigits(value);
  return /[A-Za-z@]/.test(s) ? s : phoneInput(s);
}
