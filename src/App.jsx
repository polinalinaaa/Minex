import "./App.css";
import fireBomb from "./assets/mines/fire-bomb.svg";
import walletGem from "./assets/mines/wallet-gem.svg";
import bell from "./assets/mines/bell.svg";
import avatar from "./assets/mines/avatar.png";
import house from "./assets/mines/house.svg";
import gamepad from "./assets/mines/gamepad.svg";
import chart from "./assets/mines/chart.svg";
import history from "./assets/mines/history.svg";
import settings from "./assets/mines/settings.svg";
import betGem from "./assets/mines/bet-gem.svg";
import divider from "./assets/mines/divider.svg";
import plus from "./assets/mines/plus.svg";
import unrevealed from "./assets/mines/unrevealed.svg";
import gem from "./assets/mines/gem.svg";

const NAV_ITEMS = [
  { icon: house, active: false },
  { icon: gamepad, active: true },
  { icon: chart, active: false },
  { icon: history, active: false },
  { icon: settings, active: false },
];

const MINE_COUNTS = ["1", "3", "5", "10"];

const GRID = [
  ["hidden", "hidden", "hidden", "hidden", "hidden"],
  ["hidden", "gem", "hidden", "hidden", "hidden"],
  ["hidden", "hidden", "gem", "hidden", "hidden"],
  ["hidden", "hidden", "hidden", "gem", "hidden"],
  ["hidden", "hidden", "hidden", "hidden", "hidden"],
];

const ROW_HEIGHTS = [107, 106, 107, 107, 106];

export default function App() {
  return (
    <div className="screen">
      <header className="header">
        <div className="brand-row">
          <div className="brand">
            <div className="wordmark">
              <img src={fireBomb} alt="" />
              <p>minex</p>
            </div>
            <div className="brand-spacer" />
          </div>
          <div className="account">
            <div className="wallet">
              <div className="balance">
                <img src={walletGem} alt="" />
                <p>1000.00</p>
              </div>
              <div className="credits">
                <p>Get Credits</p>
              </div>
            </div>
            <img src={bell} alt="" />
            <img className="avatar" src={avatar} alt="" width="56" height="56" />
          </div>
        </div>
        <div className="header-divider" />
      </header>

      <div className="workspace">
        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <div
              className={item.active ? "nav-item nav-item-active" : "nav-item"}
              key={item.icon}
            >
              <img src={item.icon} alt="" />
            </div>
          ))}
        </nav>

        <div className="content">
          <div className="game">
            <div className="heading-row">
              <div className="game-title">
                <p className="breadcrumb">GAMES / MINES</p>
                <h1>Mines</h1>
              </div>
            </div>

            <div className="panels">
              <section className="panel controls">
                <div className="controls-heading">
                  <h2>Game controls</h2>
                  <p>MANUAL</p>
                </div>

                <div className="bet-settings">
                  <p className="field-label">BET AMOUNT</p>
                  <div className="bet-row">
                    <div className="bet-amount">
                      <div className="bet-value">
                        <img src={betGem} alt="" />
                        <p>50.00</p>
                        <span className="divider-slot">
                          <img src={divider} alt="" />
                        </span>
                      </div>
                      <img src={plus} alt="" />
                    </div>
                    <div className="shortcuts">
                      <div className="shortcut">½</div>
                      <div className="shortcut">2×</div>
                    </div>
                  </div>
                  <div className="balance-row">
                    <p>Available balance</p>
                    <p>1000.00 credits</p>
                  </div>
                  <p className="field-label">MINES</p>
                  <div className="mine-options">
                    {MINE_COUNTS.map((count) => (
                      <div
                        className={
                          count === "3"
                            ? "mine-option mine-option-selected"
                            : "mine-option"
                        }
                        key={count}
                      >
                        {count}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="separator">
                  <div />
                </div>

                <div className="payout">
                  <div className="payout-row">
                    <span>Multiplier</span>
                    <strong className="cyan">1.00×</strong>
                  </div>
                  <div className="payout-row">
                    <span>Next tile</span>
                    <strong>1.14×</strong>
                  </div>
                  <div className="payout-row">
                    <span>Potential payout</span>
                    <strong>0.00</strong>
                  </div>
                </div>

                <div className="start">
                  <p>Start Game</p>
                </div>
              </section>

              <section className="panel board">
                <div className="board-heading">
                  <h2>Find the gems</h2>
                  <p>5 × 5 GRID</p>
                </div>
                <div className="mine-grid">
                  {GRID.map((row, rowIndex) => (
                    <div
                      className={
                        ROW_HEIGHTS[rowIndex] === 107
                          ? "tile-row tile-row-107"
                          : "tile-row tile-row-106"
                      }
                      key={rowIndex}
                    >
                      {row.map((cell, cellIndex) => (
                        <div
                          className={cell === "gem" ? "tile tile-gem" : "tile"}
                          key={cellIndex}
                        >
                          <img
                            src={cell === "gem" ? gem : unrevealed}
                            alt=""
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="board-status">
                  <p>3 MINES</p>
                  <p>3 GEMS FOUND</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
