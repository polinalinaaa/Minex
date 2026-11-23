import { useEffect, useState } from "react";
import { GIFT_CHANGE_EVENT } from "./dailyGift.js";
import { SPIN_CHANGE_EVENT } from "./dailySpin.js";

export default function useRewardClock() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    function refresh() {
      setNow(Date.now());
    }
    window.addEventListener("storage", refresh);
    window.addEventListener(SPIN_CHANGE_EVENT, refresh);
    window.addEventListener(GIFT_CHANGE_EVENT, refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", refresh);
      window.removeEventListener(SPIN_CHANGE_EVENT, refresh);
      window.removeEventListener(GIFT_CHANGE_EVENT, refresh);
    };
  }, []);

  return now;
}
