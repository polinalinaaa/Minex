import { useCallback, useEffect, useRef, useState } from "react";
import {
  AWARD_COUNT_MS,
  dismissBalanceNotice,
  subscribeCreditAward,
  visibleCredits,
} from "./creditAward.js";
import { formatMoney, roundMoney } from "./mines.js";

export default function useCreditPresentation(credits) {
  const creditsRef = useRef(credits);
  const shownRef = useRef(credits);
  const booted = useRef(false);
  const awaiting = useRef(false);
  const frame = useRef(0);
  const tween = useRef(null);
  const [shown, setShown] = useState(credits);
  const [notice, setNotice] = useState(null);
  const engine = useRef({ present() {}, settle() {} });

  function paint(value) {
    const next = roundMoney(value);
    shownRef.current = next;
    setShown(next);
  }

  function animateTo(target) {
    const from = shownRef.current;
    const to = roundMoney(target);
    if (Math.abs(to - from) < 0.001) {
      tween.current = null;
      cancelAnimationFrame(frame.current);
      paint(to);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      tween.current = null;
      cancelAnimationFrame(frame.current);
      paint(to);
      return;
    }
    tween.current = { from, to, start: performance.now() };
    cancelAnimationFrame(frame.current);
    const step = (now) => {
      const run = tween.current;
      if (!run) return;
      const progress = Math.min(1, (now - run.start) / AWARD_COUNT_MS);
      const eased = 1 - (1 - progress) ** 3;
      paint(run.from + (run.to - run.from) * eased);
      if (progress < 1) {
        frame.current = requestAnimationFrame(step);
        return;
      }
      tween.current = null;
      paint(run.to);
    };
    frame.current = requestAnimationFrame(step);
  }

  useEffect(() => {
    creditsRef.current = credits;
    engine.current.present = () => {
      const target = visibleCredits(creditsRef.current);
      if (Math.abs(target - shownRef.current) < 0.001) {
        awaiting.current = true;
        return;
      }
      awaiting.current = false;
      animateTo(target);
    };
    engine.current.settle = () => {
      awaiting.current = false;
      tween.current = null;
      cancelAnimationFrame(frame.current);
      paint(visibleCredits(creditsRef.current));
    };
  });

  const dismissNotice = useCallback((id) => {
    dismissBalanceNotice(id);
  }, []);

  useEffect(() => {
    return subscribeCreditAward((event) => {
      if (event.type === "present") engine.current.present(event.amount);
      if (event.type === "settle") engine.current.settle();
      if (event.type === "show") setNotice(event.notice);
      if (event.type === "hide") {
        setNotice((current) => (current && current.id === event.id ? null : current));
      }
    });
  }, []);

  useEffect(() => {
    const target = visibleCredits(credits);
    if (!booted.current) {
      booted.current = true;
      paint(target);
      return undefined;
    }
    if (target + 0.001 < shownRef.current) {
      awaiting.current = false;
      animateTo(target);
      return undefined;
    }
    if (awaiting.current || tween.current) {
      awaiting.current = false;
      if (!tween.current || Math.abs(tween.current.to - target) > 0.001) animateTo(target);
      return undefined;
    }
    if (Math.abs(target - shownRef.current) > 0.001) paint(target);
    return undefined;
  }, [credits]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return { text: formatMoney(shown), notice, dismissNotice };
}
