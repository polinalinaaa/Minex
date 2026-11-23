export const INVITE_BONUS_CREDITS = 100;
export const INVITE_CODE_KEY = "minex.inviteCode";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function readInviteCode(storage, random = Math.random) {
  const existing = storage.getItem(INVITE_CODE_KEY);
  if (existing && /^[a-z0-9]{8}$/.test(existing)) return existing;
  let code = "";
  for (let index = 0; index < 8; index += 1) {
    code += ALPHABET[Math.floor(random() * ALPHABET.length)];
  }
  storage.setItem(INVITE_CODE_KEY, code);
  return code;
}

export function inviteUrl(origin, code) {
  const base = String(origin).replace(/\/$/, "");
  return `${base}/?invite=${code}`;
}
