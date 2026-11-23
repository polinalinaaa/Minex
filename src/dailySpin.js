import { roundMoney } from "./mines.js";

export const SPIN_REWARDS = [10, 25, 50, 100, 250];
export const WHEEL_SECTORS = [10, 25, 50, 100, 250, 10, 25, 50, 100, 250, 10, 25];
export const SPIN_INTERVAL_MS = 24 * 60 * 60 * 1000;
export const CREDITS_KEY = "minex.credits";
export const SPIN_KEY = "minex.dailySpin";
export const SPIN_CHANGE_EVENT = "minex:dailySpin";

function notifySpinChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SPIN_CHANGE_EVENT));
}

export function readCredits(storage, fallback) {
  const raw = storage.getItem(CREDITS_KEY);
  if (raw == null || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? roundMoney(value) : fallback;
}

export function readSpin(storage) {
  const raw = storage.getItem(SPIN_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Number.isFinite(parsed.reward) || !Number.isFinite(parsed.nextAt)) return null;
    if (!Number.isInteger(parsed.index) || parsed.index < 0 || parsed.index >= SPIN_REWARDS.length) return null;
    if (SPIN_REWARDS[parsed.index] !== parsed.reward) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function restoreBalance(storage, fallback) {
  let credits = readCredits(storage, fallback);
  const spin = readSpin(storage);
  if (spin && spin.credited === false && Number.isFinite(spin.balanceAfter)) {
    credits = roundMoney(spin.balanceAfter);
    storage.setItem(CREDITS_KEY, String(credits));
    storage.setItem(SPIN_KEY, JSON.stringify({ ...spin, credited: true }));
  }
  return { credits, spin: readSpin(storage) };
}

export function claimDailySpin(storage, credits, now, random = Math.random, options = {}) {
  const current = readSpin(storage);
  if (current && current.nextAt > now) {
    return { ok: false, spin: current, credits };
  }
  const roll = random();
  const index = Math.min(SPIN_REWARDS.length - 1, Math.max(0, Math.floor(roll * SPIN_REWARDS.length)));
  const reward = SPIN_REWARDS[index];
  const dryRun = Boolean(options.dryRun);
  const balanceAfter = dryRun ? roundMoney(credits) : roundMoney(credits + reward);
  const record = {
    index,
    reward,
    nextAt: now + SPIN_INTERVAL_MS,
    balanceAfter,
    credited: true,
    dryRun,
  };
  storage.setItem(SPIN_KEY, JSON.stringify(record));
  if (!dryRun) {
    storage.setItem(CREDITS_KEY, String(balanceAfter));
  }
  notifySpinChange();
  return { ok: true, spin: record, credits: balanceAfter };
}

/** Clears local cooldown for Vite DEV tooling only. Does not grant credits. */
export function resetDailySpinDev(storage) {
  storage.removeItem(SPIN_KEY);
  notifySpinChange();
  return { ok: true };
}

export function wheelSectorForReward(index) {
  const reward = SPIN_REWARDS[index];
  const sector = WHEEL_SECTORS.indexOf(reward);
  return sector < 0 ? 0 : sector;
}

export function sectorRotation(current, index, turns = 5) {
  const step = 360 / WHEEL_SECTORS.length;
  const sector = wheelSectorForReward(index);
  const normalized = ((current % 360) + 360) % 360;
  const need = (360 - ((sector * step) % 360)) % 360;
  let delta = need - normalized;
  if (delta <= 0) delta += 360;
  return current + turns * 360 + delta;
}

export function formatSpinCountdown(remainingMs) {
  const total = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
