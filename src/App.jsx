import { lazy, Suspense, useEffect, useRef, useState } from "react";
import "./App.css";
import Button from "./Button.jsx";
import walletGem from "./assets/mines/wallet-gem.svg";
import avatar from "./assets/mines/avatar.png";
import house from "./assets/mines/house.svg";
import gamepad from "./assets/mines/gamepad.svg";
import GameControls from "./GameControls.jsx";

const HomePage = lazy(() => import("./HomePage.jsx"));
const InvitePage = lazy(() => import("./InvitePage.jsx"));
const RewardsPage = lazy(() => import("./RewardsPage.jsx"));
const ProfilePage = lazy(() => import("./ProfilePage.jsx"));
const GetCreditsPage = lazy(() => import("./GetCreditsPage.jsx"));

const PAGES = new Set(["home", "mines", "rewards", "invite", "profile", "get-credits"]);

function pageFromPath(pathname) {
  const name = pathname.replace(/\/+$/, "").split("/").filter(Boolean)[0] ?? "";
  if (!name || name === "mines") return "mines";
  return PAGES.has(name) ? name : "mines";
}

function pathForPage(page) {
  return page === "mines" ? "/" : `/${page}`;
}
import BalanceNotice from "./BalanceNotice.jsx";
import SoundControl from "./SoundControl.jsx";
import useCreditPresentation from "./useCreditPresentation.js";
import useMinesGame from "./useMinesGame.js";
import logo from "./assets/mines/logo.webp";
import minesBgDesktop from "./assets/mines/minex-bg-desktop.webp";
import minesBgMobile from "./assets/mines/minex-bg-mobile.webp";
import tileDefault from "./assets/mines/tile-default.webp";
import tileHover from "./assets/mines/tile-hover.png";
import tileBomb from "./assets/mines/tile-bomb.webp";
import tileGem from "./assets/mines/tile-gem.webp";
import readyMinox from "./assets/mines/ready-minox.webp";
import resultWon from "./assets/mines/result-won.webp";
import resultLose from "./assets/mines/result-lose.webp";

function RoundResult({ game }) {
  const won = game.screen === "won";
  return (
    <div className={won ? "round-result is-won" : "round-result is-lost"} role={won ? "status" : undefined}>
      {won ? (
        <>
          <p className="round-result-title">You won</p>
          <p className="round-result-line">
            <span>Payout</span>
            <strong>{game.banner.amount} credits</strong>
          </p>
        </>
      ) : null}
      <div className="round-result-actions">
        {game.canReplay ? (
          <Button size="medium" onClick={game.replay}>Play again</Button>
        ) : (
          <Button size="medium" onClick={game.addFreeCredits}>Get free credits</Button>
        )}
        <Button size="medium" variant="secondary" onClick={game.playAgain}>
          Change bet
        </Button>
      </div>
    </div>
  );
}

function BoardBanner({ banner }) {
  if (banner.tone === "lost") {
    return (
      <div
        className="board-banner board-banner-lost"
        role="status"
        aria-label={`BOOM! YOU HIT A MINE. You lost ${banner.amount} credits`}
      >
        <p className="board-result-title">BOOM! YOU HIT A MINE</p>
        <p className="board-result-detail">
          You lost <strong>{banner.amount}</strong> credits
        </p>
      </div>
    );
  }

  if (banner.tone === "won") {
    return (
      <div
        className="board-banner board-banner-won"
        role="status"
        aria-label={`YOU WON! You won ${banner.amount} credits`}
      >
        <p className="board-result-title">YOU WON!</p>
        <p className="board-result-detail">You found gems and can cash out</p>
      </div>
    );
  }

  return (
    <div className={`board-banner board-banner-${banner.tone}`} role="status">
      <p className="board-banner-title">{banner.title}</p>
      <p>{banner.detail}</p>
    </div>
  );
}

function RewardsIcon() {
  return (
    <svg viewBox="0 0 26 26" aria-hidden="true">
      <rect x="4.5" y="11" width="17" height="10.5" rx="1.6" fill="none" stroke="#ABB9E0" strokeWidth="1.7" />
      <path d="M4.5 15.2h17M13 11v10.5" fill="none" stroke="#ABB9E0" strokeWidth="1.7" />
      <path d="M13 11c0-2.4-2.2-4.2-4-3.2-1.4.8-1 2.6.6 3.2H13Zm0 0c0-2.4 2.2-4.2 4-3.2 1.4.8 1 2.6-.6 3.2H13Z" fill="none" stroke="#ABB9E0" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function InviteIcon() {
  return (
    <svg viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="9" cy="9" r="3" fill="none" stroke="#ABB9E0" strokeWidth="1.7" />
      <path d="M3.8 19.2c.5-2.8 2.6-4.4 5.2-4.4s4.7 1.6 5.2 4.4" fill="none" stroke="#ABB9E0" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="17.4" cy="9.4" r="2.5" fill="none" stroke="#ABB9E0" strokeWidth="1.7" />
      <path d="M16.2 14.9c1.8.3 3.4 1.4 4.2 3.6" fill="none" stroke="#ABB9E0" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="13" cy="9" r="3.15" fill="none" stroke="#ABB9E0" strokeWidth="1.7" />
      <path d="M6.2 19.8c.8-3.2 3.4-5 6.8-5s6 1.8 6.8 5" fill="none" stroke="#ABB9E0" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function NavIcon({ icon }) {
  if (icon === "rewards") return <RewardsIcon />;
  if (icon === "invite") return <InviteIcon />;
  if (icon === "profile") return <ProfileIcon />;
  return <img src={icon} alt="" />;
}

const NAV_ITEMS = [
  { id: "home", icon: house, label: "Home", page: "home" },
  { id: "mines", icon: gamepad, label: "Mines", page: "mines" },
  { id: "rewards", icon: "rewards", label: "Spin", page: "rewards" },
  { id: "invite", icon: "invite", label: "Invite Friends", short: "Invite", page: "invite" },
  { id: "profile", icon: "profile", label: "Profile", page: "profile" },
];

function useBoardIntro(screen) {
  const waiting = screen === "ready" || screen === "insufficient";
  const [mounted, setMounted] = useState(waiting);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (waiting) {
      setMounted(true);
      setLeaving(false);
      return undefined;
    }
    if (!mounted) return undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setLeaving(false);
      setMounted(false);
      return undefined;
    }
    setLeaving(true);
    const timer = window.setTimeout(() => {
      setMounted(false);
      setLeaving(false);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [waiting, mounted]);

  return { mounted, leaving, locked: waiting };
}

export default function App() {
  const [page, setPage] = useState(() => pageFromPath(window.location.pathname));
  const [focusId, setFocusId] = useState(null);
  const game = useMinesGame();
  const gamePane = useRef(null);
  const balance = useCreditPresentation(game.credits);
  const controlsGame =
    balance.text === game.creditsText
      ? game
      : { ...game, creditsLabel: `${balance.text} credits` };
  const intro = useBoardIntro(game.screen);
  const mineHit = game.tiles.find((tile) => tile.kind === "mine");
  const minesStep =
    game.screen === "playing" ? "play" : game.screen === "won" || game.screen === "lost" ? "result" : "setup";
  const playMultiplier = game.summary.find((row) => row.label === "Current multiplier")?.value ?? "1.00×";
  const playCash = game.summary.find((row) => row.label === "Cash out amount")?.value ?? "0.00";
  const roundBet = game.summary.find((row) => row.label === "Bet placed")?.value ?? game.betValue;
  const resultFx = useRef({ active: false, play: false });
  if (minesStep === "result") {
    if (!resultFx.current.active) {
      const compact = window.matchMedia("(max-width: 1024px)").matches;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      resultFx.current = { active: true, play: compact && !reduce };
    }
  } else if (resultFx.current.active) {
    resultFx.current = { active: false, play: false };
  }

  useEffect(() => {
    const pane = gamePane.current;
    if (page !== "mines" || !pane || minesStep === "result") return undefined;
    if (!window.matchMedia("(max-width: 1024px)").matches) return undefined;
    pane.scrollTop = 0;
    const frame = requestAnimationFrame(() => {
      const action = pane.querySelector(".phone-cashout");
      if (!action || minesStep !== "play") return;
      const overflow = action.getBoundingClientRect().bottom - pane.getBoundingClientRect().bottom;
      if (overflow > 1) pane.scrollTop += overflow + 16;
    });
    return () => cancelAnimationFrame(frame);
  }, [minesStep, page]);

  useEffect(() => {
    const current = pageFromPath(window.location.pathname);
    const canonical = pathForPage(current);
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    if (path !== canonical) {
      window.history.replaceState({ page: current }, "", `${canonical}${window.location.search}${window.location.hash}`);
    }
    function onPop() {
      setPage(pageFromPath(window.location.pathname));
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function openPage(nextPage, nextFocus = null) {
    const origin = page;
    setPage(nextPage);
    setFocusId(nextFocus);
    const nextPath = pathForPage(nextPage);
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    if (path !== nextPath) {
      const state = { page: nextPage };
      if (nextPage === "get-credits") state.returnPage = origin;
      window.history.pushState(state, "", `${nextPath}${window.location.search}${window.location.hash}`);
    }
  }

  function leaveCredits() {
    const state = window.history.state;
    if (state?.page === "get-credits" && PAGES.has(state.returnPage) && state.returnPage !== "get-credits") {
      window.history.back();
      return;
    }
    openPage("mines");
  }

  return (
    <>
    <div className="mines-backdrop" aria-hidden="true">
      <picture>
        <source media="(max-width: 767px)" srcSet={minesBgMobile} type="image/webp" />
        <source media="(min-width: 768px)" srcSet={minesBgDesktop} type="image/webp" />
        <img alt="" />
      </picture>
      <div className="mines-backdrop-shade" />
    </div>
    <div className={page === "home" ? "screen screen-home" : "screen"}>
      <header className={balance.notice ? "header header-award" : "header"}>
        <div className="brand-row">
          <div className="brand">
            <div className="wordmark">
              <img src={logo} alt="minex" />
            </div>
            <div className="brand-spacer" />
          </div>
          <div className="account">
            <div className="wallet-wrap">
              <div className="wallet">
                <div className="balance">
                  <img src={walletGem} alt="" />
                  <p aria-hidden="true">{balance.text}</p>
                  <span className="balance-live">{game.creditsText}</span>
                </div>
                <Button
                  className="credits credits-header"
                  size="small"
                  aria-current={page === "get-credits" ? "page" : undefined}
                  onClick={() => openPage("get-credits")}
                >
                  Get Credits
                </Button>
              </div>
              <BalanceNotice
                key={balance.notice ? balance.notice.id : "idle"}
                notice={balance.notice}
                onDismiss={balance.dismissNotice}
              />
            </div>
            <SoundControl />
            <button
              className="avatar-button btn-icon"
              type="button"
              aria-label="Open profile"
              aria-current={page === "profile" ? "page" : undefined}
              onClick={() => openPage("profile")}
            >
              <img src={avatar} alt="" width="56" height="56" />
            </button>
          </div>
        </div>
        <div className="header-divider" />
      </header>

      <div className="workspace">
        <nav className="nav">
          {NAV_ITEMS.map((item) => {
            const current = item.page === page;
            return (
              <button
                className={
                  current
                    ? `nav-item fx fx-selected nav-item-active${item.id === "profile" ? " nav-item-profile" : ""}`
                    : `nav-item fx${item.id === "profile" ? " nav-item-profile" : ""}`
                }
                type="button"
                aria-label={item.label}
                aria-current={current ? "page" : undefined}
                key={item.id}
                onClick={() => {
                  if (item.page) openPage(item.page);
                }}
              >
                <NavIcon icon={item.icon} />
                <span>{item.short ?? item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="content">
          <Suspense fallback={null}>
          {page === "home" ? (
            <HomePage
              credits={game.credits}
              setCredits={game.setCredits}
              onPlay={() => openPage("mines")}
              onRewards={(target) => openPage("rewards", target)}
              onInvite={() => openPage("invite")}
            />
          ) : null}
          {page === "rewards" ? (
            <RewardsPage
              credits={game.credits}
              setCredits={game.setCredits}
              focusId={focusId}
            />
          ) : null}
          {page === "invite" ? <InvitePage /> : null}
          {page === "profile" ? <ProfilePage credits={game.creditsText} /> : null}
          {page === "get-credits" ? (
            <GetCreditsPage
              credits={game.credits}
              creditsText={game.creditsText}
              onSetCredits={game.setCredits}
              onBack={leaveCredits}
              onPlay={() => openPage("mines")}
            />
          ) : null}
          </Suspense>
          {page === "mines" ? (
          <div className={`game mines-step-${minesStep}`} ref={gamePane}>
            <div className="heading-row">
              <div className="game-title">
                <h1>Mines</h1>
              </div>
            </div>

            <div className="panels">
              <GameControls game={controlsGame} />

              <section className="panel board" aria-label="Mine field">
                <div
                  className="phone-play-bar"
                  aria-hidden={minesStep === "play" || minesStep === "result" ? undefined : true}
                >
                  <p>
                    <span>Bet</span> <strong>{roundBet}</strong>
                  </p>
                  <p>
                    <span>Mines</span> <strong>{game.boardMines}</strong>
                  </p>
                </div>
                <div className="board-heading">
                  <h2>Find the gems</h2>
                  <p>5 × 5 GRID</p>
                </div>
                <div className="board-fit">
                <div className={intro.locked ? "mine-stage mine-stage-idle" : "mine-stage"}>
                <div
                  className={mineHit ? "mine-grid mine-grid-lost" : "mine-grid"}
                  inert={intro.locked ? true : undefined}
                  style={
                    mineHit
                      ? {
                          "--boom-x": `${((mineHit.index % 5) + 0.5) * 20}%`,
                          "--boom-y": `${(Math.floor(mineHit.index / 5) + 0.5) * 20}%`,
                        }
                      : undefined
                  }
                >
                  {game.tiles.map((tile) => (
                    <button
                      className={
                        tile.kind === "gem"
                          ? "tile tile-gem"
                          : tile.kind === "mine"
                            ? "tile tile-mine"
                            : "tile"
                      }
                      type="button"
                      key={tile.index}
                      disabled={tile.disabled || intro.locked}
                      tabIndex={tile.disabled || intro.locked ? -1 : undefined}
                      aria-label={
                        tile.kind === "gem"
                          ? `Gem, tile ${tile.index + 1}`
                          : tile.kind === "mine"
                            ? `Mine, tile ${tile.index + 1}`
                            : `Hidden tile ${tile.index + 1}`
                      }
                      onClick={() => game.reveal(tile.index)}
                    >
                      {tile.kind === "hidden" ? (
                        <>
                          <img className="tile-face tile-face-default" src={tileDefault} alt="" />
                          <img className="tile-face tile-face-hover" src={tileHover} alt="" />
                        </>
                      ) : (
                        <img className="tile-face" src={tile.kind === "gem" ? tileGem : tileBomb} alt="" />
                      )}
                    </button>
                  ))}
                  {mineHit ? (
                    <div className="explosion" aria-hidden="true">
                      <span className="explosion-burst" />
                      <span className="explosion-ring" />
                      <span className="explosion-ring explosion-ring-2" />
                      <span className="explosion-sparks" />
                    </div>
                  ) : null}
                </div>
                {game.screen === "won" || game.screen === "lost" ? (
                  <>
                    <div
                      className={resultFx.current.play ? "board-result-veil is-once" : "board-result-veil"}
                      aria-hidden="true"
                    />
                    <div
                      className={
                        game.screen === "won"
                          ? `board-result-splash board-result-splash-won${resultFx.current.play ? " is-once" : ""}`
                          : `board-result-splash board-result-splash-lost${resultFx.current.play ? " is-once" : ""}`
                      }
                      role={game.screen === "lost" ? "img" : undefined}
                      aria-label={game.screen === "lost" ? "You lose. You hit a mine" : undefined}
                      aria-hidden={game.screen === "lost" ? undefined : true}
                    >
                      <img
                        src={game.screen === "won" ? resultWon : resultLose}
                        alt=""
                      />
                    </div>
                  </>
                ) : null}
                {intro.mounted ? (
                  <>
                    <div
                      className={intro.leaving ? "board-veil board-veil-leave" : "board-veil"}
                      aria-hidden="true"
                    />
                    <div className={intro.leaving ? "board-ready board-ready-leave" : "board-ready"}>
                      <div className="ready-stack">
                        <div className="ready-compose">
                          <div className="ready-minox-slot">
                            <img className="board-ready-minox board-ready-minox-back" src={readyMinox} alt="" />
                            <img className="board-ready-minox board-ready-minox-front" src={readyMinox} alt="" aria-hidden="true" />
                          </div>
                          <div className="ready-card">
                            <div className="ready-card-body">
                              <p className="ready-card-title">
                                Ready to <span>play?</span>
                              </p>
                              <p className="ready-card-copy">
                                Set your bet and mines, then press Start Game.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
                </div>
                </div>
                {minesStep === "result" ? <RoundResult game={game} /> : null}
                <div className="phone-play-meta" aria-hidden={minesStep === "play" ? undefined : true}>
                  <p>
                    <span>Multiplier</span> <strong>{playMultiplier}</strong>
                  </p>
                  <p>
                    <span>Payout</span> <strong>{playCash}</strong>
                  </p>
                </div>
                <Button
                  wide
                  className="phone-cashout"
                  aria-hidden={minesStep === "play" ? undefined : true}
                  disabled={game.screen !== "playing" || game.primary.disabled}
                  onClick={game.cashOut}
                >
                  {`Cash out — ${playCash} credits`}
                </Button>
                <div className="board-status">
                  <p>{game.boardMines} MINES</p>
                  <p>{game.boardGems} GEMS FOUND</p>
                </div>
                <div
                  className="board-banner-slot"
                  aria-hidden={game.banner.tone === "ready" ? true : undefined}
                >
                  {game.banner.tone === "ready" ? null : <BoardBanner banner={game.banner} />}
                </div>
              </section>
            </div>
          </div>
          ) : null}
        </div>
      </div>
    </div>
    </>
  );
}
