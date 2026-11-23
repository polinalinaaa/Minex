import { formatSpinCountdown } from "./dailySpin.js";

export function rewardStatus(record, now) {
  if (!record || !Number.isFinite(record.nextAt) || record.nextAt <= now) {
    return { state: "available", label: "Available now", countdown: "" };
  }
  return {
    state: "claimed",
    label: "Claimed",
    countdown: formatSpinCountdown(record.nextAt - now),
  };
}
