// Display-name rules for OP Game Hub. Used by the API; the pick-a-name page shows the same rules.
//
// A name: 3 to 20 characters, letters / numbers / underscore, starts with a letter,
// no long runs of digits (stops phone numbers), not reserved, not rude.
// To block another word, add it to BLOCKED (lowercase). If a harmless name gets caught,
// add the harmless word to ALLOWED.

const RESERVED_EXACT = new Set([
  'about', 'account', 'accounts', 'anon', 'anonymous', 'api', 'everyone', 'guest', 'help',
  'login', 'logout', 'me', 'mod', 'mods', 'null', 'owner', 'privacy', 'register', 'root',
  'settings', 'signin', 'signout', 'signup', 'system', 'terms', 'undefined', 'user', 'users',
  'welcome', 'you',
]);
const RESERVED_START = ['admin', 'moderator', 'official', 'staff', 'support'];
const RESERVED_ANYWHERE = ['opgamehub', 'opgame', 'ophub', 'gamehub', 'google', 'cloudflare', 'anthropic', 'claude'];

const BLOCKED = [
  // English
  'fuck', 'fuk', 'fck', 'shit', 'bitch', 'btch', 'cunt', 'dick', 'cock', 'pussy', 'penis',
  'vagina', 'boob', 'tits', 'porn', 'sex', 'nude', 'naked', 'slut', 'whore', 'rape', 'rapist',
  'molest', 'pedo', 'paedo', 'nazi', 'hitler', 'kkk', 'nigg', 'faggot', 'fagg', 'retard',
  'tranny', 'bastard', 'wank', 'jerkoff', 'dildo', 'milf', 'onlyfans', 'xxx', 'suicide',
  'killyourself', 'terrorist',
  // Hindi / Hinglish
  'chutiya', 'chutia', 'chutya', 'chootiya', 'chootia', 'madarchod', 'bhenchod', 'behenchod', 'bhosdi', 'bhosda',
  'bhosad', 'bsdk', 'gandu', 'randi', 'lavda', 'lauda', 'lawda', 'chod', 'harami',
];
const ALLOWED = [
  'peacock', 'cockatoo', 'cockatiel', 'cockpit', 'cockroach', 'hancock', 'dickens', 'sussex',
  'essex', 'grape', 'drape', 'scrape', 'trapez', 'therapist', 'torpedo', 'pedometer', 'nazir',
  'grandi', 'brandi', 'shiitake',
];

const LEET_I = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', 9: 'g', '@': 'a', '$': 's' };
const LEET_L = { ...LEET_I, 1: 'l' };

function variants(lower) {
  const plain = lower.replace(/_/g, '');
  const swap = (map) => plain.replace(/[0-9@$]/g, (c) => map[c] ?? c);
  return [plain, swap(LEET_I), swap(LEET_L)].map((v) => ALLOWED.reduce((s, ok) => s.split(ok).join('~'), v));
}

export function isRude(name) {
  return variants(name.toLowerCase()).some((v) => BLOCKED.some((bad) => v.includes(bad)));
}

export function checkUsername(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return { ok: false, reason: 'Type a name first.' };
  const name = raw.trim();
  if (name.length < 3) return { ok: false, reason: 'Too short. Use at least 3 characters.' };
  if (name.length > 20) return { ok: false, reason: 'Too long. 20 characters max.' };
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
    return { ok: false, reason: 'Use letters, numbers and _ only, and start with a letter.' };
  }
  if (/\d{6,}/.test(name)) return { ok: false, reason: 'Too many numbers in a row. 5 max.' };
  const lower = name.toLowerCase();
  if (
    RESERVED_EXACT.has(lower) ||
    RESERVED_START.some((w) => lower.startsWith(w)) ||
    RESERVED_ANYWHERE.some((w) => lower.replace(/_/g, '').includes(w))
  ) {
    return { ok: false, reason: 'That name is reserved. Try another.' };
  }
  if (isRude(name)) return { ok: false, reason: "That name isn't allowed. Try another." };
  return { ok: true, name };
}
