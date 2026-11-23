import assert from "node:assert/strict";
import test from "node:test";
import {
  CREDITS_KEY,
  SPIN_INTERVAL_MS,
  SPIN_KEY,
  SPIN_REWARDS,
  WHEEL_SECTORS,
  claimDailySpin,
  formatSpinCountdown,
  resetDailySpinDev,
  restoreBalance,
  sectorRotation,
} from "./dailySpin.js";

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
    removeItem(key) {
      delete data[key];
    },
    dump: data,
  };
}

test("each reward is equally reachable and lands on its sector", () => {
  assert.deepEqual(SPIN_REWARDS, [10, 25, 50, 100, 250]);
  const now = 1_000_000;
  SPIN_REWARDS.forEach((reward, index) => {
    const storage = memoryStorage({ [CREDITS_KEY]: "1000" });
    const claimed = claimDailySpin(storage, 1000, now, () => index / SPIN_REWARDS.length);
    assert.equal(claimed.ok, true);
    assert.equal(claimed.spin.reward, reward);
    assert.equal(claimed.spin.index, index);
    assert.equal(claimed.credits, 1000 + reward);
    assert.equal(claimed.spin.nextAt, now + SPIN_INTERVAL_MS);
    assert.equal(WHEEL_SECTORS[pointerSector(sectorRotation(0, index, 0))], reward);
  });
});

test("the sector under the pointer matches the awarded prize", () => {
  [0, 40, 180, 359].forEach((start) => {
    SPIN_REWARDS.forEach((reward, index) => {
      const rotation = sectorRotation(start, index, 5);
      assert.equal(WHEEL_SECTORS[pointerSector(rotation)], reward);
    });
  });
});

function pointerSector(rotation) {
  const step = 360 / WHEEL_SECTORS.length;
  const normalized = ((rotation % 360) + 360) % 360;
  let best = 0;
  let bestDist = 360;
  for (let sector = 0; sector < WHEEL_SECTORS.length; sector += 1) {
    const at = (sector * step + normalized) % 360;
    const dist = Math.min(at, 360 - at);
    if (dist < bestDist) {
      best = sector;
      bestDist = dist;
    }
  }
  return best;
}

test("a second claim inside 24 hours does not pay again", () => {
  const storage = memoryStorage();
  const now = 5_000;
  const first = claimDailySpin(storage, 40, now, () => 0.5);
  const second = claimDailySpin(storage, first.credits, now + 60_000, () => 0);
  assert.equal(second.ok, false);
  assert.equal(second.credits, first.credits);
  assert.equal(second.spin.reward, first.spin.reward);
  assert.equal(storage.getItem(CREDITS_KEY), String(first.credits));
});

test("a reload before the reward is marked credited pays it once", () => {
  const storage = memoryStorage({ [CREDITS_KEY]: "80" });
  const pending = {
    index: 3,
    reward: 100,
    nextAt: 9_000,
    balanceAfter: 180,
    credited: false,
  };
  storage.setItem(SPIN_KEY, JSON.stringify(pending));
  const first = restoreBalance(storage, 1000);
  const second = restoreBalance(storage, 1000);
  assert.equal(first.credits, 180);
  assert.equal(second.credits, 180);
  assert.equal(storage.getItem(CREDITS_KEY), "180");
  assert.equal(JSON.parse(storage.getItem(SPIN_KEY)).credited, true);
});

test("countdown uses hours, minutes, and seconds", () => {
  assert.equal(formatSpinCountdown(0), "00:00:00");
  assert.equal(formatSpinCountdown(3661_000), "01:01:01");
});

test("dry-run claim records a result without changing credits", () => {
  const storage = memoryStorage({ [CREDITS_KEY]: "500" });
  const claimed = claimDailySpin(storage, 500, 1_000, () => 0, { dryRun: true });
  assert.equal(claimed.ok, true);
  assert.equal(claimed.credits, 500);
  assert.equal(claimed.spin.dryRun, true);
  assert.equal(claimed.spin.reward, 10);
  assert.equal(storage.getItem(CREDITS_KEY), "500");
});

test("resetDailySpinDev clears the local cooldown record", () => {
  const storage = memoryStorage();
  const claimed = claimDailySpin(storage, 100, 2_000, () => 0.5);
  assert.ok(storage.getItem(SPIN_KEY));
  resetDailySpinDev(storage);
  assert.equal(storage.getItem(SPIN_KEY), null);
  const again = claimDailySpin(storage, claimed.credits, 2_000 + 60_000, () => 0);
  assert.equal(again.ok, true);
});
