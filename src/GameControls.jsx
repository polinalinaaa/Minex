import { useState } from "react";
import betGem from "./assets/mines/bet-gem.svg";
import plus from "./assets/mines/plus.svg";
import Button from "./Button.jsx";
import GameControl from "./GameControl.jsx";

function useChangeKey(value) {
  const [track, setTrack] = useState({ value, key: 0 });
  if (!Object.is(track.value, value)) {
    setTrack({ value, key: track.key + 1 });
  }
  return Object.is(track.value, value) ? track.key : track.key + 1;
}

export default function GameControls({ game }) {
  const multiplierKey = useChangeKey(game.nextTile.multiplier);
  const payoutKey = useChangeKey(game.nextTile.payout);

  function onPrimary() {
    if (game.primary.action === "start") game.start();
    if (game.primary.action === "cashout") game.cashOut();
    if (game.primary.action === "again") game.playAgain();
    if (game.primary.action === "credits") game.addFreeCredits();
  }

  return (
    <section className="panel controls" aria-label="Game controls">
      <div className="controls-heading">
        <h2>Game controls</h2>
      </div>

      <div className="bet-settings">
        <p className="field-label" id="bet-label">
          BET AMOUNT
        </p>
        <div className="bet-row">
          <div className="bet-field">
          <div
            className={
              game.settingsLocked
                ? "bet-amount bet-amount-locked"
                : game.error
                  ? "bet-amount bet-amount-invalid"
                  : "bet-amount"
            }
          >
            <div className="bet-value">
              <img src={betGem} alt="" />
              <input
                className="bet-input"
                aria-labelledby="bet-label"
                aria-describedby={game.error ? "bet-error" : undefined}
                aria-invalid={game.error ? "true" : "false"}
                inputMode="decimal"
                spellCheck={false}
                autoComplete="off"
                placeholder="0.00"
                value={game.betValue}
                disabled={game.settingsLocked}
                onChange={(event) => game.setBet(event.target.value)}
                onBlur={game.blurBet}
              />
            </div>
            {game.betValue !== "" ? (
              <button
                className="bet-clear btn-icon"
                type="button"
                aria-label="Clear bet"
                disabled={!game.canClear}
                onClick={game.clearBet}
              >
                <img src={plus} alt="" />
              </button>
            ) : null}
          </div>
          <p
            className="bet-error"
            id="bet-error"
            role={game.error ? "alert" : undefined}
            aria-hidden={game.error ? undefined : true}
          >
            {game.error}
          </p>
          </div>
          <div className="shortcuts">
            {game.presets.map((preset) => (
              <GameControl
                key={preset.amount}
                className="shortcut"
                disabled={!preset.enabled}
                onClick={() => game.setPresetBet(preset.amount)}
              >
                {preset.label}
              </GameControl>
            ))}
            <GameControl
              className="shortcut"
              aria-label="Maximum bet"
              disabled={!game.canMaxBet}
              onClick={game.maxBet}
            >
              Max
            </GameControl>
          </div>
        </div>
        <div className="balance-row">
          <p>Available balance</p>
          <p>{game.creditsLabel}</p>
        </div>
        <p className="field-label">MINES</p>
        <div className="mine-options" role="group" aria-label="Mine count">
          {game.mineOptions.map((count) => (
            <GameControl
              className="mine-option"
              selected={count === game.selectedMines}
              disabled={game.settingsLocked}
              key={count}
              onClick={() => game.setMines(count)}
            >
              {count}
            </GameControl>
          ))}
        </div>
        <div className="next-tile" aria-live="polite">
          <p className="next-tile-main">
            <span>Next tile multiplier</span>
            <strong key={multiplierKey} className={multiplierKey > 0 ? "is-updated" : undefined}>
              {game.nextTile.multiplier}
            </strong>
          </p>
          {game.nextTile.payout ? (
            <p className="next-tile-payout">
              <span>Potential payout</span>
              <strong key={payoutKey} className={payoutKey > 0 ? "is-updated" : undefined}>
                {game.nextTile.payout}
              </strong>
            </p>
          ) : null}
        </div>
      </div>

      <div className="separator">
        <div />
      </div>

      <div className="payout" aria-live="polite">
        {game.summary.map((row) => (
          <div
            className={
              row.tone === "net-win" || row.tone === "net-loss"
                ? "payout-row payout-row-net"
                : "payout-row"
            }
            key={row.label}
          >
            <span>{row.label}</span>
            <strong className={row.tone || undefined}>{row.value}</strong>
          </div>
        ))}
      </div>

      <Button wide disabled={game.primary.disabled} onClick={onPrimary}>
        {game.primary.label}
      </Button>
      {game.offerFreeCredits ? (
        <Button variant="secondary" wide className="credits-inline" onClick={game.addFreeCredits}>
          Get free credits
        </Button>
      ) : null}
    </section>
  );
}
