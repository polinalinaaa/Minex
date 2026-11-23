import { useRef, useState } from "react";
import "./HomePage.css";
import Button from "./Button.jsx";
import gameMines from "./assets/mines/games/mines.webp";
import gameSpin from "./assets/mines/games/spin.webp";
import gameCrash from "./assets/mines/games/crash.webp";
import gameDice from "./assets/mines/games/dice.webp";
import gamePlinko from "./assets/mines/games/plinko.webp";
import gameLimbo from "./assets/mines/games/limbo.webp";
import heroBg from "./assets/mines/home-hero-bg.jpg";
import heroRaccoon from "./assets/mines/home-hero-raccoon.webp";
import rewardGift from "./assets/mines/rewards/daily-gift.webp";
import rewardSpin from "./assets/mines/rewards/daily-spin.webp";
import { DAILY_GIFT_CREDITS, claimDailyGift, readGift } from "./dailyGift.js";
import { releaseCreditAward, stageCreditAward } from "./creditAward.js";
import { readSpin } from "./dailySpin.js";
import { INVITE_BONUS_CREDITS } from "./invite.js";
import { rewardStatus } from "./rewardStatus.js";
import RewardStatus from "./RewardStatus.jsx";
import useRewardClock from "./useRewardClock.js";
import { playSound } from "./sound.js";

function PlayableCard({ title, image, action, onOpen }) {
  return (
    <button
      className="game-card game-card-play"
      type="button"
      onClick={onOpen}
    >
      <img className="game-card-bg" src={image} alt="" />
      <span className="game-card-title">{title}</span>
      <span className="game-card-button">{action}</span>
    </button>
  );
}

function RewardCardAction({ available, label, variant = "primary", onClick, disabled = false }) {
  return (
    <div className="reward-card-action">
      {available ? (
        <Button variant={variant} size="small" className="reward-card-btn" disabled={disabled} onClick={onClick}>
          {label}
        </Button>
      ) : (
        <p className="reward-card-claimed">Claimed</p>
      )}
    </div>
  );
}

function SoonCard({ title, image }) {
  return (
    <article className="game-card game-card-soon" aria-label={`${title}, coming soon`}>
      <img className="game-card-bg" src={image} alt="" />
      <span className="game-badge game-badge-soon">Coming soon</span>
      <span className="game-card-title">{title}</span>
      <span className="game-card-button game-card-button-soon">Coming soon</span>
    </article>
  );
}

export default function HomePage({ credits, setCredits, onPlay, onRewards, onInvite }) {
  const now = useRewardClock();
  const gift = rewardStatus(readGift(localStorage), now);
  const spin = rewardStatus(readSpin(localStorage), now);
  const [claiming, setClaiming] = useState(false);
  const claimLock = useRef(false);
  if (gift.state === "available") claimLock.current = false;
  if (gift.state === "available" && claiming) setClaiming(false);

  function onClaimGift() {
    if (claimLock.current || gift.state !== "available") return;
    claimLock.current = true;
    setClaiming(true);
    const claimed = claimDailyGift(localStorage, credits, Date.now());
    if (!claimed.ok) {
      claimLock.current = false;
      setClaiming(false);
      return;
    }
    const awardId = stageCreditAward(claimed.gift.amount);
    setCredits(claimed.credits);
    releaseCreditAward(awardId);
    playSound("win");
  }

  return (
    <div className="page-scroll home-page">
      <div className="home-top">
        <section className="panel home-hero" style={{ "--hero-bg": `url("${heroBg}")` }} aria-labelledby="mines-hero-title">
          <div className="home-hero-copy">
            <p className="home-kicker">Mines</p>
            <h1 id="mines-hero-title">
              <span>Find diamonds.</span>
              <span>Dodge mines.</span>
            </h1>
            <p>Your next move could be a winning one.</p>
            <Button className="home-play" onClick={onPlay}>
              Play
              <svg className="home-play-arrow" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 8h9.2M8.2 4.2 12.2 8l-4 3.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
          </div>
          <div className="home-hero-art" aria-hidden="true">
            <img src={heroRaccoon} alt="" />
          </div>
        </section>

        <section className="panel home-rewards" aria-labelledby="daily-rewards-title">
          <h2 id="daily-rewards-title">Daily Rewards</h2>
          <article className="reward-card">
            <img className="reward-card-art" src={rewardGift} alt="" />
            <div className="reward-card-copy">
              <h3>Daily Gift</h3>
              <p className="reward-note">{DAILY_GIFT_CREDITS} credits</p>
              <RewardStatus status={gift} timerOnly={gift.state !== "available"} />
            </div>
            <RewardCardAction
              available={gift.state === "available"}
              label="Claim gift"
              disabled={claiming}
              onClick={onClaimGift}
            />
          </article>
          <article className="reward-card">
            <img className="reward-card-art" src={rewardSpin} alt="" />
            <div className="reward-card-copy">
              <h3>Daily Spin</h3>
              <p className="reward-note">Free once a day</p>
              <RewardStatus status={spin} timerOnly={spin.state !== "available"} />
            </div>
            <RewardCardAction
              available={spin.state === "available"}
              label="Go to spin"
              variant="secondary"
              onClick={() => onRewards("daily-spin")}
            />
          </article>
        </section>
      </div>

      <section className="panel home-invite" aria-labelledby="invite-banner-title">
        <div className="home-invite-copy">
          <h2 id="invite-banner-title">Invite a friend. Get {INVITE_BONUS_CREDITS} credits.</h2>
          <p>You receive the bonus when a friend joins Minex with your link.</p>
          <Button variant="secondary" size="small" className="home-action" onClick={onInvite}>
            Invite friends
          </Button>
        </div>
      </section>

      <section className="home-games" aria-labelledby="games-title">
        <h2 id="games-title">Games</h2>
        <div className="home-catalog">
          <PlayableCard title="Mines" image={gameMines} action="Play" onOpen={onPlay} />
          <PlayableCard
            title="Daily Spin"
            image={gameSpin}
            action="Play"
            onOpen={() => onRewards("daily-spin")}
          />
          <SoonCard title="Crash" image={gameCrash} />
          <SoonCard title="Dice" image={gameDice} />
          <SoonCard title="Plinko" image={gamePlinko} />
          <SoonCard title="Limbo" image={gameLimbo} />
        </div>
      </section>
    </div>
  );
}
