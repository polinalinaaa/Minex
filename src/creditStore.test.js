import assert from "node:assert/strict";
import test from "node:test";
import {
  CREDIT_PACKAGES,
  creditTopUp,
  formatPackageCredits,
} from "./creditStore.js";

test("demo packages keep the listed credits and fictional prices", () => {
  assert.deepEqual(
    CREDIT_PACKAGES.map((pack) => [pack.credits, pack.price, pack.badge]),
    [
      [500, "$4.99", ""],
      [1200, "$9.99", "Popular"],
      [3000, "$19.99", ""],
      [7000, "$39.99", "Best value"],
    ],
  );
  assert.equal(formatPackageCredits(1200), "1,200");
  assert.equal(formatPackageCredits(7000), "7,000");
});

test("a confirmed top-up is added once and a second confirmation does not", () => {
  const pack = CREDIT_PACKAGES[0];
  const first = creditTopUp(21950.66, pack.credits, false);
  assert.equal(first.applied, true);
  assert.equal(first.balance, 22450.66);

  const repeat = creditTopUp(first.balance, pack.credits, true);
  assert.equal(repeat.applied, false);
  assert.equal(repeat.balance, 22450.66);

  const next = creditTopUp(first.balance, 1200, false);
  assert.equal(next.applied, true);
  assert.equal(next.balance, 23650.66);
});

test("cancellation does not change the balance", () => {
  const untouched = creditTopUp(1000.5, 500, true);
  assert.equal(untouched.applied, false);
  assert.equal(untouched.balance, 1000.5);
  assert.equal(creditTopUp(1000, 0, false).applied, false);
});
