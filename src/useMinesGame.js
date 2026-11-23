import { useEffect, useRef, useState } from "react";
import {
  FREE_CREDITS,
  MINE_OPTIONS,
  maxStake,
  presetBet,
  cashOut,
  createGameState,
  formatMoney,
  grantFreeCredits,
  playAgain,
  replayRound,
  revealTile,
  roundMoney,
  settlementNotice,
  startRound,
  viewModel,
} from "./mines.js";
import { enqueueBalanceNotice, releaseCreditAward, stageCreditAward } from "./creditAward.js";
import { playSound } from "./sound.js";
import { restoreGift } from "./dailyGift.js";
import { CREDITS_KEY, restoreBalance } from "./dailySpin.js";

function publishSettlement(previous, next, rounds, announced, serial) {
  const notice = settlementNotice(previous, next);
  if (!notice || !previous.round) return;
  let roundId = rounds.get(previous.round);
  if (!roundId) {
    serial.current += 1;
    roundId = serial.current;
    rounds.set(previous.round, roundId);
  }
  const key = `${roundId}:${notice.tone}`;
  if (announced.current === key) return;
  announced.current = key;
  if (notice.tone === "lost") return;
  releaseCreditAward(stageCreditAward(notice.amount));
}

function createInitialState() {
  const base = createGameState();
  try {
    const restored = restoreBalance(localStorage, base.credits);
    const credits = restoreGift(localStorage, restored.credits);
    return { ...base, credits };
  } catch {
    return base;
  }
}

export default function useMinesGame() {
  const [state, setState] = useState(createInitialState);
  const rounds = useRef(new WeakMap());
  const roundSerial = useRef(0);
  const announced = useRef("");

  const view = viewModel(state);

  useEffect(() => {
    try {
      localStorage.setItem(CREDITS_KEY, String(state.credits));
    } catch {
      // The session still keeps the balance in memory.
    }
  }, [state.credits]);

  return {
    credits: state.credits,
    creditsText: formatMoney(state.credits),
    mineOptions: MINE_OPTIONS,
    ...view,
    setBet(value) {
      setState((current) =>
        current.phase === "playing" ? current : { ...current, nextBet: value },
      );
    },
    blurBet() {
      setState((current) => {
        if (current.phase === "playing") return current;
        const parsed = current.nextBet.trim();
        if (!parsed) return current;
        const match = parsed.replace(",", ".").match(/^\d+(\.\d{1,2})?$/);
        if (!match) return current;
        return { ...current, nextBet: formatMoney(Number(match[0])) };
      });
    },
    clearBet() {
      setState((current) =>
        current.phase === "playing" ? current : { ...current, nextBet: "" },
      );
    },
    setPresetBet(amount) {
      setState((current) => {
        if (current.phase === "playing") return current;
        const nextBet = presetBet(amount, current.credits);
        return nextBet === null ? current : { ...current, nextBet };
      });
    },
    maxBet() {
      setState((current) => {
        if (current.phase === "playing") return current;
        const stake = maxStake(current.credits);
        return stake === null ? current : { ...current, nextBet: formatMoney(stake) };
      });
    },
    setMines(count) {
      setState((current) =>
        current.phase === "playing" ? current : { ...current, nextMines: count },
      );
    },
    start() {
      setState((current) => startRound(current));
    },
    reveal(index) {
      const next = revealTile(state, index);
      if (next === state) return;
      publishSettlement(state, next, rounds.current, announced, roundSerial);
      if (next.phase === "lost") playSound("boom");
      else if (next.phase === "won") playSound("win");
      else playSound("gem");
      setState(next);
    },
    cashOut() {
      const next = cashOut(state);
      if (next === state) return;
      publishSettlement(state, next, rounds.current, announced, roundSerial);
      if (next.phase === "won") playSound("win");
      setState(next);
    },
    playAgain() {
      setState((current) => playAgain(current));
    },
    replay() {
      setState((current) => replayRound(current));
    },
    addFreeCredits() {
      setState((current) => grantFreeCredits(current));
      enqueueBalanceNotice("received", FREE_CREDITS);
      playSound("win");
    },
    setCredits(credits) {
      setState((current) => ({ ...current, credits: roundMoney(credits) }));
    },
  };
}
