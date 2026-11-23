import { roundMoney } from "./mines.js";

export const DEMO_PURCHASE_NOTE = "Demo purchase — no real money will be charged.";

export const CREDIT_PACKAGES = [
  { id: "pack-500", credits: 500, price: "$4.99", badge: "", art: "gem-500" },
  { id: "pack-1200", credits: 1200, price: "$9.99", badge: "Popular", art: "gem-1200" },
  { id: "pack-3000", credits: 3000, price: "$19.99", badge: "", art: "gem-3000" },
  { id: "pack-7000", credits: 7000, price: "$39.99", badge: "Best value", art: "gem-7000" },
];

export const DEFAULT_PACKAGE_ID = "pack-1200";

export function formatPackageCredits(credits) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(credits);
}

/** Adds one demo package to the saved balance. A repeated confirmation is ignored. */
export function creditTopUp(balance, amount, alreadyApplied) {
  const current = roundMoney(Number(balance));
  const credits = roundMoney(Number(amount));
  if (alreadyApplied || !(credits > 0) || !Number.isFinite(current)) {
    return { applied: false, balance: Number.isFinite(current) ? current : 0 };
  }
  return { applied: true, balance: roundMoney(current + credits) };
}
