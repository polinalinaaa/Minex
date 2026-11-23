import { useEffect, useState } from "react";
import { BALANCE_NOTICE, balanceNoticeCopy, balanceNoticeDetail } from "./creditAward.js";

const timing = {
  "--notice-enter": `${BALANCE_NOTICE.enterMs}ms`,
  "--notice-exit": `${BALANCE_NOTICE.exitMs}ms`,
  "--notice-pulse": `${BALANCE_NOTICE.pulseMs}ms`,
};

export default function BalanceNotice({ notice, onDismiss }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!notice) return undefined;
    setLeaving(false);
    const life = window.setTimeout(() => setLeaving(true), BALANCE_NOTICE.lifeMs);
    function onKey(event) {
      if (event.key === "Escape") setLeaving(true);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(life);
      window.removeEventListener("keydown", onKey);
    };
  }, [notice]);

  useEffect(() => {
    if (!notice || !leaving) return undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => onDismiss(notice.id), reduce ? 0 : BALANCE_NOTICE.exitMs);
    return () => window.clearTimeout(timer);
  }, [leaving, notice, onDismiss]);

  if (!notice) return null;

  return (
    <div
      className={leaving ? "balance-notice is-leaving" : "balance-notice"}
      data-tone={notice.tone}
      role="status"
      style={timing}
    >
      <div className="balance-notice-copy">
        <p className="balance-notice-amount">{balanceNoticeCopy(notice.tone, notice.amount)}</p>
        <p className="balance-notice-detail">{balanceNoticeDetail(notice.tone)}</p>
      </div>
      <button
        className="btn-icon"
        type="button"
        aria-label="Dismiss"
        onClick={() => setLeaving(true)}
      >
        ×
      </button>
    </div>
  );
}
