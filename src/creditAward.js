import { formatMoney, roundMoney } from "./mines.js";

/** How long the balance counter runs. Display only; the balance is already saved. */
export const AWARD_COUNT_MS = 780;

/** Shared timing for every balance notice. */
export const BALANCE_NOTICE = {
  enterMs: 280,
  exitMs: 280,
  lifeMs: 4000,
  pulseMs: 700,
};

let nextId = 0;
/** @type {{ id: number, amount: number }[]} */
let held = [];
/** @type {{ id: number, tone: "received" | "lost", amount: number }[]} */
let queue = [];
/** @type {{ id: number, tone: "received" | "lost", amount: number } | null} */
let showing = null;
/** @type {Set<(event: { type: string, id?: number, amount?: number, notice?: { id: number, tone: string, amount: number } }) => void>} */
const listeners = new Set();

function emit(event) {
  listeners.forEach((listener) => listener(event));
}

export function balanceNoticeCopy(tone, amount) {
  const sign = tone === "lost" ? "−" : "+";
  return `${sign}${formatMoney(amount)} credits`;
}

export function balanceNoticeDetail(tone) {
  return tone === "lost" ? "Lost in Mines" : "Added to your balance";
}

function pump() {
  if (showing || queue.length === 0) return;
  showing = queue.shift();
  emit({ type: "show", id: showing.id, notice: showing });
}

/** Credits already saved, but not yet shown on the counter. */
export function heldCreditAwards() {
  return roundMoney(held.reduce((sum, award) => sum + award.amount, 0));
}

export function visibleCredits(credits) {
  return roundMoney(credits - heldCreditAwards());
}

/**
 * Hide `amount` from the balance counter until release or drop.
 * The wallet balance itself must already include this amount.
 */
export function stageCreditAward(amount) {
  const value = roundMoney(amount);
  if (!(value > 0)) return 0;
  const id = ++nextId;
  held.push({ id, amount: value });
  return id;
}

/** Show one staged award. A second call does nothing. */
export function releaseCreditAward(id) {
  const index = held.findIndex((award) => award.id === id);
  if (index < 0) return false;
  const [award] = held.splice(index, 1);
  emit({ type: "present", id: award.id, amount: award.amount });
  enqueueBalanceNotice("received", award.amount);
  return true;
}

/**
 * Queue one balance notice. A second call with a new id waits until the
 * current notice is dismissed. Zero and negative amounts are ignored.
 */
export function enqueueBalanceNotice(tone, amount) {
  const value = roundMoney(amount);
  if (!(value > 0)) return 0;
  if (tone !== "received" && tone !== "lost") return 0;
  const id = ++nextId;
  queue.push({ id, tone, amount: value });
  pump();
  return id;
}

/** Dismiss the notice on screen. The next queued notice starts afterwards. */
export function dismissBalanceNotice(id) {
  if (!showing || showing.id !== id) return false;
  const dismissed = showing.id;
  showing = null;
  emit({ type: "hide", id: dismissed });
  pump();
  return true;
}

/** Forget a staged award without a notice. The counter catches up to the saved balance. */
export function dropCreditAward(id) {
  const index = held.findIndex((award) => award.id === id);
  if (index < 0) return false;
  held.splice(index, 1);
  emit({ type: "settle" });
  return true;
}

export function subscribeCreditAward(listener) {
  listeners.add(listener);
  if (showing) listener({ type: "show", id: showing.id, notice: showing });
  return () => listeners.delete(listener);
}
