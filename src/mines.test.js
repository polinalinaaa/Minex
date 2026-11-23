import assert from "node:assert/strict";
import test from "node:test";
import {
  MIN_BET,
  maxStake,
  presetBet,
  cashOut,
  createGameState,
  displayedMultiplier,
  formatMoney,
  formatMultiplier,
  grantFreeCredits,
  parseBet,
  payoutFor,
  playAgain,
  replayRound,
  revealTile,
  safeTileCount,
  settlementNotice,
  startRound,
  viewModel,
} from "./mines.js";

test("three mines leave 22 safe tiles and a 1.14 first multiplier", () => {
  assert.equal(safeTileCount(3), 22);
  assert.equal(displayedMultiplier(3, 1), 1.14);
  assert.equal(payoutFor(50, 3, 1), 57);
});

test("bet validation rejects empty, zero, negative, and malformed input", () => {
  assert.equal(parseBet("").reason, "empty");
  assert.equal(parseBet("0").reason, "zero");
  assert.equal(parseBet("0.00").reason, "zero");
  assert.equal(parseBet("-5").reason, "negative");
  assert.equal(parseBet("abc").reason, "invalid");
  assert.equal(parseBet("1.234").reason, "invalid");
  assert.equal(parseBet("0.009").reason, "invalid");
  assert.equal(parseBet("50").value, 50);
});

test("preset bets replace the stake and stay inside the balance", () => {
  assert.equal(presetBet(100, 1000), "100.00");
  assert.equal(presetBet(500, 250.5), null);
  assert.equal(presetBet(1000, 1000), "1000.00");
  assert.equal(presetBet(100, 0), null);
  assert.equal(maxStake(37.5), 37.5);
  assert.equal(maxStake(0), null);

  const ready = viewModel({ ...createGameState(), credits: 250, nextBet: "50.00" });
  assert.deepEqual(
    ready.presets.map((preset) => [preset.label, preset.enabled]),
    [
      ["100", true],
      ["500", false],
      ["1000", false],
    ],
  );
  assert.equal(ready.canMaxBet, true);

  const playing = viewModel(startRound(createGameState(), () => 0.5));
  assert.equal(playing.presets.every((preset) => preset.enabled === false), true);
  assert.equal(playing.canMaxBet, false);
});

test("start deducts the stake once and ignores a second start", () => {
  const started = startRound(createGameState(), () => 0.5);
  assert.equal(started.phase, "playing");
  assert.equal(started.credits, 950);
  assert.equal(startRound(started).credits, 950);
});

test("a bet above the balance does not start", () => {
  const state = { ...createGameState(), nextBet: "1000.01" };
  assert.equal(startRound(state), state);
});

test("cash out is blocked before a gem and pays exactly once", () => {
  const layout = Array(25).fill(false);
  layout[24] = true;
  let state = startRound({ ...createGameState(), nextMines: 1 }, () => 0);
  state = { ...state, round: { ...state.round, mineMap: layout, mines: 1 } };
  assert.equal(cashOut(state).phase, "playing");
  state = revealTile(state, 0);
  const paid = cashOut(state);
  assert.equal(paid.phase, "won");
  assert.equal(paid.lastRound.payout, payoutFor(50, 1, 1));
  assert.equal(paid.credits, 950 + paid.lastRound.payout);
  assert.equal(cashOut(paid).credits, paid.credits);
});

test("a loss reports the stake already taken, and a win reports only the credited payout", () => {
  const layout = Array(25).fill(false);
  layout[1] = true;
  let playing = startRound({ ...createGameState(), nextMines: 1 });
  playing = { ...playing, round: { ...playing.round, mineMap: layout, mines: 1 } };
  const lost = revealTile(playing, 1);
  assert.equal(lost.credits, playing.credits);
  assert.equal(lost.lastRound.net, -50);
  assert.deepEqual(
    viewModel(lost).summary.map((row) => row.label),
    ["Last round", "Bet placed", "Gems found"],
  );
  assert.deepEqual(settlementNotice(playing, lost), { tone: "lost", amount: 50 });
  assert.equal(settlementNotice(lost, revealTile(lost, 3)), null);

  let winning = startRound({ ...createGameState(), nextMines: 1 });
  winning = { ...winning, round: { ...winning.round, mineMap: layout, mines: 1 } };
  winning = revealTile(winning, 0);
  const won = cashOut(winning);
  const notice = settlementNotice(winning, won);
  assert.equal(notice.tone, "received");
  assert.equal(notice.amount, won.credits - winning.credits);
  assert.equal(notice.amount, won.lastRound.payout);
  assert.notEqual(notice.amount, won.lastRound.payout + won.lastRound.bet);
  assert.ok(notice.amount > won.lastRound.net);
});

test("hitting a mine records only the gems found and does not charge twice", () => {
  const layout = Array(25).fill(false);
  layout[1] = true;
  let state = startRound({ ...createGameState(), nextMines: 3 });
  state = { ...state, round: { ...state.round, mineMap: layout, mines: 3 } };
  state = revealTile(state, 0);
  state = revealTile(state, 2);
  state = revealTile(state, 1);
  assert.equal(state.phase, "lost");
  assert.equal(state.lastRound.gemsFound, 2);
  assert.equal(state.lastRound.safeTiles, 22);
  assert.equal(state.lastRound.net, -50);
  assert.equal(state.credits, 950);
  assert.equal(revealTile(state, 3).credits, 950);
  assert.equal(viewModel(state).banner.detail, "You lost 50.00 credits");
});

test("clearing every safe tile wins and a later bet edit does not rewrite the round", () => {
  const layout = Array(25).fill(false);
  layout.fill(true, 22);
  let state = startRound({ ...createGameState(), nextMines: 3 });
  state = { ...state, round: { ...state.round, mineMap: layout, mines: 3 } };
  for (let index = 0; index < 22; index += 1) state = revealTile(state, index);
  assert.equal(state.phase, "won");
  assert.equal(state.lastRound.gemsFound, 22);
  assert.equal(state.lastRound.net, state.lastRound.payout - state.lastRound.bet);
  const edited = { ...state, nextBet: "10.00", nextMines: 1 };
  assert.equal(edited.lastRound.bet, 50);
  assert.equal(edited.lastRound.gemsFound, 22);
  const ready = playAgain(edited);
  assert.equal(ready.phase, "ready");
  assert.equal(ready.lastRound, null);
  assert.equal(ready.nextBet, "10.00");
  const again = startRound(ready, () => 0.2);
  assert.equal(again.phase, "playing");
  assert.equal(again.round.bet, 10);
});

test("the next tile offer follows the selected mines, stake, and reveals", () => {
  const three = viewModel(createGameState());
  const one = viewModel({ ...createGameState(), nextMines: 1, nextBet: "10.00" });
  assert.equal(one.nextTile.multiplier, formatMultiplier(displayedMultiplier(1, 1)));
  assert.equal(one.nextTile.payout, formatMoney(payoutFor(10, 1, 1)));
  assert.notEqual(one.nextTile.multiplier, three.nextTile.multiplier);

  const empty = viewModel({ ...createGameState(), nextBet: "" });
  assert.equal(empty.nextTile.multiplier, three.nextTile.multiplier);
  assert.equal(empty.nextTile.payout, null);

  const layout = Array(25).fill(false);
  layout[1] = true;
  let playing = startRound({ ...createGameState(), nextMines: 5 });
  playing = { ...playing, round: { ...playing.round, mineMap: layout, mines: 5 } };
  assert.equal(viewModel(playing).nextTile.multiplier, formatMultiplier(displayedMultiplier(5, 1)));
  assert.equal(
    viewModel(playing).summary.some((row) => row.label === "Next safe tile" || row.label === "Next tile"),
    false,
  );
  playing = revealTile(playing, 0);
  assert.equal(viewModel(playing).nextTile.multiplier, formatMultiplier(displayedMultiplier(5, 2)));
  assert.equal(viewModel(playing).nextTile.payout, formatMoney(payoutFor(50, 5, 2)));
});

test("ready, short, and broke views follow the balance", () => {
  const ready = viewModel(createGameState());
  assert.equal(ready.screen, "ready");
  assert.equal(ready.banner.title, "Ready to play?");
  assert.equal(ready.primary.label, "Start Game");
  assert.equal(ready.primary.disabled, false);
  assert.deepEqual(ready.summary, []);
  assert.equal(ready.nextTile.multiplier, formatMultiplier(displayedMultiplier(3, 1)));
  assert.equal(ready.nextTile.payout, formatMoney(payoutFor(50, 3, 1)));

  const short = viewModel({ ...createGameState(), credits: 40, nextBet: "50.00" });
  assert.equal(short.screen, "insufficient");
  assert.equal(short.banner.title, "Not enough credits");
  assert.equal(short.primary.disabled, true);
  assert.equal(short.offerFreeCredits, true);
  assert.match(short.error, /Not enough credits/);

  const broke = viewModel({ ...createGameState(), credits: 0, nextBet: "" });
  assert.equal(broke.primary.action, "credits");
  assert.equal(broke.error, "Enter a bet amount.");

  const brokeWithStake = viewModel({ ...createGameState(), credits: 0, nextBet: "425.00" });
  assert.equal(brokeWithStake.primary.action, "credits");
  assert.equal(brokeWithStake.error, "Not enough credits.");
  assert.equal(brokeWithStake.banner.title, "Not enough credits");
});

test("bet field errors describe the input, and a valid stake checks the balance", () => {
  const message = (credits, nextBet) =>
    viewModel({ ...createGameState(), credits, nextBet }).error;

  assert.equal(message(1000, ""), "Enter a bet amount.");
  assert.equal(message(1000, "0"), "Bet must be greater than zero.");
  assert.equal(message(1000, "0.00"), "Bet must be greater than zero.");
  assert.equal(message(1000, "-5"), "Bet cannot be negative.");
  assert.equal(message(1000, "abc"), "Enter a valid amount.");
  assert.equal(message(1000, "1.234"), "Enter a valid amount.");
  assert.equal(message(0, ""), "Enter a bet amount.");
  assert.equal(message(0, "0.00"), "Bet must be greater than zero.");
  assert.equal(message(0, "425.00"), "Not enough credits.");
  assert.equal(message(0, "0.01"), "Not enough credits.");
  assert.equal(message(40, "50.00"), "Not enough credits.");
  assert.equal(message(50, "50.00"), "");
  assert.equal(message(1000, "0.01"), "");
});

test("free credits are virtual and can fund a later round", () => {
  const broke = { ...createGameState(), credits: 0, nextBet: "50.00" };
  const funded = grantFreeCredits(broke);
  assert.equal(funded.credits, 1000);
  assert.equal(startRound(funded, () => 0.2).phase, "playing");
  assert.equal(MIN_BET, 0.01);
});

test("replay starts one new round and does not charge when the stake does not fit", () => {
  const layout = Array(25).fill(false);
  layout[0] = true;
  let finished = startRound(createGameState(), () => 0.2);
  finished = { ...finished, round: { ...finished.round, mineMap: layout } };
  finished = revealTile(finished, 0);
  assert.equal(finished.phase, "lost");
  const creditsAfterLoss = finished.credits;
  assert.equal(viewModel(finished).canReplay, true);

  const replayed = replayRound(finished, () => 0.2);
  assert.equal(replayed.phase, "playing");
  assert.equal(replayed.credits, creditsAfterLoss - 50);
  assert.equal(replayed.round.gemsFound, 0);
  assert.notEqual(replayed.round, finished.round);
  assert.equal(replayRound(replayed, () => 0.2), replayed);

  const short = { ...finished, credits: 1 };
  assert.equal(viewModel(short).canReplay, false);
  const parked = replayRound(short, () => 0.9);
  assert.equal(parked.phase, "ready");
  assert.equal(parked.credits, 1);
  assert.equal(parked.round, null);
  assert.equal(parked.nextBet, finished.nextBet);
  assert.equal(parked.nextMines, finished.nextMines);
});
