import { roundMoney } from "./mines.js";
import { CREDITS_KEY, SPIN_INTERVAL_MS } from "./dailySpin.js";

export const DAILY_GIFT_CREDITS = 50;
export const GIFT_KEY = "minex.dailyGift";
export const GIFT_INTERVAL_MS = SPIN_INTERVAL_MS;
export const GIFT_CHANGE_EVENT = "minex:dailyGift";

function notifyGiftChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(GIFT_CHANGE_EVENT));
}

export function readGift(storage) {
  const raw = storage.getItem(GIFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Number.isFinite(parsed.amount) || !Number.isFinite(parsed.nextAt)) return null;
    if (parsed.credited !== true && parsed.credited !== false) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function claimDailyGift(storage, credits, now) {
  const current = readGift(storage);
  if (current && current.nextAt > now) {
    return { ok: false, gift: current, credits };
  }
  const balanceAfter = roundMoney(credits + DAILY_GIFT_CREDITS);
  const record = {
    amount: DAILY_GIFT_CREDITS,
    nextAt: now + GIFT_INTERVAL_MS,
    balanceAfter,
    credited: false,
  };
  storage.setItem(GIFT_KEY, JSON.stringify(record));
  storage.setItem(CREDITS_KEY, String(balanceAfter));
  const committed = { ...record, credited: true };
  storage.setItem(GIFT_KEY, JSON.stringify(committed));
  notifyGiftChange();
  return { ok: true, gift: committed, credits: balanceAfter };
}

export function restoreGift(storage, credits) {
  const gift = readGift(storage);
  if (gift && gift.credited === false && Number.isFinite(gift.balanceAfter)) {
    const next = roundMoney(gift.balanceAfter);
    storage.setItem(CREDITS_KEY, String(next));
    storage.setItem(GIFT_KEY, JSON.stringify({ ...gift, credited: true }));
    return next;
  }
  return credits;
}
