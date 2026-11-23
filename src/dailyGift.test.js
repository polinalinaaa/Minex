import assert from "node:assert/strict";
import test from "node:test";
import { CREDITS_KEY } from "./dailySpin.js";
import {
  DAILY_GIFT_CREDITS,
  GIFT_INTERVAL_MS,
  GIFT_KEY,
  claimDailyGift,
  readGift,
  restoreGift,
} from "./dailyGift.js";
import { rewardStatus } from "./rewardStatus.js";

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
  };
}

test("a daily gift pays once and then waits 24 hours", () => {
  const storage = memoryStorage({ [CREDITS_KEY]: "1000" });
  const now = 10_000;
  const first = claimDailyGift(storage, 1000, now);
  const second = claimDailyGift(storage, first.credits, now + 60_000);
  assert.equal(first.ok, true);
  assert.equal(first.credits, 1000 + DAILY_GIFT_CREDITS);
  assert.equal(first.gift.amount, DAILY_GIFT_CREDITS);
  assert.equal(first.gift.nextAt, now + GIFT_INTERVAL_MS);
  assert.equal(first.gift.credited, true);
  assert.equal(second.ok, false);
  assert.equal(second.credits, first.credits);
  assert.equal(storage.getItem(CREDITS_KEY), String(first.credits));
});

test("a reload before the gift is marked credited pays it once", () => {
  const storage = memoryStorage({ [CREDITS_KEY]: "80" });
  storage.setItem(
    GIFT_KEY,
    JSON.stringify({
      amount: DAILY_GIFT_CREDITS,
      nextAt: 9_000,
      balanceAfter: 130,
      credited: false,
    }),
  );
  const first = restoreGift(storage, 80);
  const second = restoreGift(storage, first);
  assert.equal(first, 130);
  assert.equal(second, 130);
  assert.equal(storage.getItem(CREDITS_KEY), "130");
  assert.equal(readGift(storage).credited, true);
});

test("reward status is shared by the home card and the rewards page", () => {
  const now = 1_000_000;
  assert.deepEqual(rewardStatus(null, now), {
    state: "available",
    label: "Available now",
    countdown: "",
  });
  const waiting = rewardStatus({ nextAt: now + 3_661_000 }, now);
  assert.equal(waiting.state, "claimed");
  assert.equal(waiting.label, "Claimed");
  assert.equal(waiting.countdown, "01:01:01");
  assert.equal(rewardStatus({ nextAt: now }, now).state, "available");
});
