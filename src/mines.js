export const GRID_SIZE = 25;
export const GRID_COLS = 5;
export const MINE_OPTIONS = [1, 3, 5, 10];
export const MIN_BET = 0.01;
export const PRESET_BETS = [100, 500, 1000];
export const STARTING_CREDITS = 1000;
export const FREE_CREDITS = 1000;

const ROW_HEIGHTS = [107, 106, 107, 107, 106];

export function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatMoney(value) {
  return roundMoney(value).toFixed(2);
}

export function formatSignedMoney(value) {
  const amount = formatMoney(Math.abs(value));
  if (value > 0) return `+${amount}`;
  if (value < 0) return `\u2212${amount}`;
  return amount;
}

export function formatMultiplier(value) {
  return `${roundMoney(value).toFixed(2)}×`;
}

export function parseBet(input) {
  if (typeof input !== "string") return { ok: false, reason: "invalid" };
  const trimmed = input.trim().replace(",", ".");
  if (!trimmed) return { ok: false, reason: "empty" };
  if (trimmed.startsWith("-")) return { ok: false, reason: "negative" };
  if (!/^\d+(\.\d{0,2})?$/.test(trimmed)) return { ok: false, reason: "invalid" };
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { ok: false, reason: "invalid" };
  if (value === 0) return { ok: false, reason: "zero" };
  if (value < MIN_BET) return { ok: false, reason: "below-minimum" };
  return { ok: true, value: roundMoney(value) };
}

export function betError(reason) {
  switch (reason) {
    case "empty":
      return "Enter a bet amount.";
    case "zero":
      return "Bet must be greater than zero.";
    case "negative":
      return "Bet cannot be negative.";
    case "below-minimum":
      return "Minimum bet is 0.01.";
    default:
      return "Enter a valid amount.";
  }
}

export function safeTileCount(mines) {
  return GRID_SIZE - mines;
}

export function exactMultiplier(mines, gems) {
  if (gems <= 0) return 1;
  let result = 1;
  for (let index = 0; index < gems; index += 1) {
    result *= (GRID_SIZE - index) / (GRID_SIZE - mines - index);
  }
  return result;
}

export function displayedMultiplier(mines, gems) {
  return roundMoney(exactMultiplier(mines, gems));
}

export function payoutFor(bet, mines, gems) {
  if (gems <= 0) return 0;
  return roundMoney(bet * displayedMultiplier(mines, gems));
}

export function createMines(mineCount, random = Math.random) {
  const order = Array.from({ length: GRID_SIZE }, (_, index) => index);
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [order[index], order[swap]] = [order[swap], order[index]];
  }
  const mines = Array(GRID_SIZE).fill(false);
  for (let index = 0; index < mineCount; index += 1) mines[order[index]] = true;
  return mines;
}

export function createGameState() {
  return {
    credits: STARTING_CREDITS,
    nextBet: "50.00",
    nextMines: 3,
    phase: "ready",
    round: null,
    lastRound: null,
  };
}

export function balanceProblem(credits, betValue) {
  if (credits < MIN_BET) return "broke";
  if (betValue > credits) return "short";
  return null;
}

export function maxStake(credits) {
  const available = roundMoney(credits);
  if (!Number.isFinite(available) || available < MIN_BET) return null;
  return available;
}

export function presetBet(amount, credits) {
  const stake = roundMoney(amount);
  const cap = maxStake(credits);
  if (cap === null || stake < MIN_BET || stake > cap) return null;
  return formatMoney(stake);
}

function snapshot(round, status, payout) {
  return {
    status,
    bet: round.bet,
    mines: round.mines,
    gemsFound: round.gemsFound,
    safeTiles: safeTileCount(round.mines),
    multiplier: displayedMultiplier(round.mines, round.gemsFound),
    payout,
    net: roundMoney(payout - round.bet),
  };
}

export function startRound(state, random = Math.random) {
  if (state.phase !== "ready") return state;
  const parsed = parseBet(state.nextBet);
  if (!parsed.ok || balanceProblem(state.credits, parsed.value)) return state;
  return {
    ...state,
    credits: roundMoney(state.credits - parsed.value),
    phase: "playing",
    lastRound: null,
    round: {
      bet: parsed.value,
      mines: state.nextMines,
      mineMap: createMines(state.nextMines, random),
      revealed: Array(GRID_SIZE).fill(null),
      gemsFound: 0,
    },
  };
}

export function revealTile(state, index) {
  if (state.phase !== "playing" || !state.round) return state;
  if (state.round.revealed[index]) return state;
  const revealed = state.round.revealed.slice();
  if (state.round.mineMap[index]) {
    revealed[index] = "mine";
    const round = { ...state.round, revealed };
    return {
      ...state,
      phase: "lost",
      round,
      lastRound: snapshot(round, "lost", 0),
    };
  }
  revealed[index] = "gem";
  const round = {
    ...state.round,
    revealed,
    gemsFound: state.round.gemsFound + 1,
  };
  if (round.gemsFound === safeTileCount(round.mines)) {
    const payout = payoutFor(round.bet, round.mines, round.gemsFound);
    return {
      ...state,
      credits: roundMoney(state.credits + payout),
      phase: "won",
      round,
      lastRound: snapshot(round, "won", payout),
    };
  }
  return { ...state, round };
}

export function cashOut(state) {
  if (state.phase !== "playing" || !state.round || state.round.gemsFound < 1) return state;
  const payout = payoutFor(state.round.bet, state.round.mines, state.round.gemsFound);
  return {
    ...state,
    credits: roundMoney(state.credits + payout),
    phase: "won",
    lastRound: snapshot(state.round, "won", payout),
  };
}

/**
 * One notice for a finished round.
 * The stake is already removed in startRound, so a loss only reports that stake.
 * A win reports the payout credited at settlement (stake returned plus profit),
 * which is the balance delta — not the stake added on top of the payout.
 */
export function settlementNotice(previous, next) {
  if (previous === next || previous.phase !== "playing" || !next.lastRound) return null;
  if (next.phase === "lost") {
    return { tone: "lost", amount: next.lastRound.bet };
  }
  if (next.phase === "won") {
    const credited = roundMoney(next.credits - previous.credits);
    if (!(credited > 0)) return null;
    return { tone: "received", amount: credited };
  }
  return null;
}

export function playAgain(state) {
  if (state.phase !== "won" && state.phase !== "lost") return state;
  return {
    ...state,
    phase: "ready",
    round: null,
    lastRound: null,
  };
}

/** One update: return to ready, then start with the saved stake. No-ops without charging when the stake does not fit. */
export function replayRound(state, random = Math.random) {
  if (state.phase !== "won" && state.phase !== "lost") return state;
  return startRound(playAgain(state), random);
}

export function grantFreeCredits(state, amount = FREE_CREDITS) {
  return { ...state, credits: roundMoney(state.credits + amount) };
}

export function viewModel(state) {
  const parsed = parseBet(state.nextBet);
  const activeMines = state.phase === "playing" && state.round ? state.round.mines : state.nextMines;
  const settingsLocked = state.phase === "playing";
  const broke = state.credits < MIN_BET;
  const problem = broke
    ? "broke"
    : parsed.ok && parsed.value > state.credits
      ? "short"
      : null;
  const insufficient = state.phase === "ready" && (problem === "broke" || problem === "short");
  const screen = insufficient ? "insufficient" : state.phase;

  let error = "";
  if (state.phase === "ready" && !parsed.ok) {
    error = betError(parsed.reason);
  } else if (state.phase === "ready" && problem) {
    error = "Not enough credits.";
  }

  const summary = summaryRows(state);
  const revealedGems = state.phase === "playing" && state.round ? state.round.gemsFound : 0;
  const nextGems = Math.min(revealedGems + 1, safeTileCount(activeMines));
  const stake = state.phase === "playing" && state.round ? state.round.bet : parsed.ok ? parsed.value : null;
  const nextTile = {
    multiplier: formatMultiplier(displayedMultiplier(activeMines, nextGems)),
    payout: stake == null ? null : formatMoney(payoutFor(stake, activeMines, nextGems)),
  };
  const gemsFound = state.round?.gemsFound ?? 0;
  const cashAmount = state.round ? payoutFor(state.round.bet, state.round.mines, gemsFound) : 0;

  let primary = { label: "Start Game", action: "start", disabled: true };
  if (state.phase === "playing") {
    primary = {
      label: gemsFound > 0 ? `Cash out ${formatMoney(cashAmount)}` : "Cash out",
      action: "cashout",
      disabled: gemsFound < 1,
    };
  } else if (state.phase === "won" || state.phase === "lost") {
    primary = { label: "Play Again", action: "again", disabled: false };
  } else if (problem === "broke") {
    primary = { label: "Get free credits", action: "credits", disabled: false };
  } else if (parsed.ok && !problem) {
    primary = { label: "Start Game", action: "start", disabled: false };
  }

  const tiles = Array.from({ length: GRID_SIZE }, (_, index) => {
    const revealed = state.round?.revealed[index] ?? null;
    const showMine = state.phase === "lost" && revealed === "mine";
    const showGem = revealed === "gem";
    return {
      index,
      kind: showMine ? "mine" : showGem ? "gem" : "hidden",
      disabled: state.phase !== "playing" || revealed !== null,
    };
  });

  return {
    screen,
    banner: boardBanner(state, problem),
    settingsLocked,
    error,
    summary,
    nextTile,
    primary,
    creditsLabel: `${formatMoney(state.credits)} credits`,
    betValue: settingsLocked && state.round ? formatMoney(state.round.bet) : state.nextBet,
    selectedMines: activeMines,
    boardMines: state.round ? state.round.mines : state.nextMines,
    boardGems: state.round ? state.round.gemsFound : 0,
    tiles,
    rows: ROW_HEIGHTS,
    canClear: !settingsLocked && state.nextBet !== "",

    presets: PRESET_BETS.map((amount) => ({
      amount,
      label: String(amount),
      enabled: !settingsLocked && presetBet(amount, state.credits) !== null,
    })),
    canMaxBet: !settingsLocked && maxStake(state.credits) !== null,
    offerFreeCredits: problem === "short" && state.phase === "ready",
    canReplay:
      (state.phase === "won" || state.phase === "lost") &&
      parsed.ok &&
      !balanceProblem(state.credits, parsed.value),
  };
}

function boardBanner(state, problem) {
  if (state.phase === "playing") {
    return {
      tone: "playing",
      title: "Pick a tile",
      detail: "Find gems and avoid the mines",
    };
  }

  if (state.phase === "won" && state.lastRound) {
    const amount = formatMoney(state.lastRound.payout);
    return {
      tone: "won",
      title: "You won",
      detail: `You won ${amount} credits!`,
      amount,
    };
  }

  if (state.phase === "lost" && state.lastRound) {
    const amount = formatMoney(state.lastRound.bet);
    return {
      tone: "lost",
      title: "Boom! You hit a mine",
      detail: `You lost ${amount} credits`,
      amount,
    };
  }

  if (state.phase === "ready" && problem) {
    return {
      tone: "short",
      title: "Not enough credits",
      detail: "Get free credits to start playing",
    };
  }

  return {
    tone: "ready",
    title: "Ready to play?",
    detail: "Set your bet and mines, then press Start Game.",
  };
}

function summaryRows(state) {
  if ((state.phase === "won" || state.phase === "lost") && state.lastRound) {
    const round = state.lastRound;
    const gems = `${round.gemsFound}/${round.safeTiles}`;
    if (round.status === "lost") {
      return [
        { label: "Last round", value: "Lost" },
        { label: "Bet placed", value: formatMoney(round.bet) },
        { label: "Gems found", value: gems },
      ];
    }
    return [
      { label: "Last round", value: "Won" },
      { label: "Bet placed", value: formatMoney(round.bet) },
      { label: "Final multiplier", value: formatMultiplier(round.multiplier) },
      { label: "Gems found", value: gems },
      { label: "Total payout", value: formatMoney(round.payout) },
      { label: "Net result", value: formatSignedMoney(round.net), tone: "net-win" },
    ];
  }

  if (state.phase === "playing" && state.round) {
    const found = state.round.gemsFound;
    const current = displayedMultiplier(state.round.mines, found);
    const cash = payoutFor(state.round.bet, state.round.mines, found);
    return [
      { label: "Current multiplier", value: formatMultiplier(found === 0 ? 1 : current), tone: "accent" },
      { label: "Cash out amount", value: formatMoney(cash) },
    ];
  }

  return [];
}
