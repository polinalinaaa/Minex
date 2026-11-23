import { useEffect, useId, useRef, useState } from "react";
import "./GetCreditsPage.css";
import Button from "./Button.jsx";
import walletGem from "./assets/mines/wallet-gem.svg";
import creditSuccessGem from "./assets/credits/credit-success-gem.png";
import gem500 from "./assets/credits/gem-500.webp";
import gem1200 from "./assets/credits/gem-1200.webp";
import gem3000 from "./assets/credits/gem-3000.webp";
import gem7000 from "./assets/credits/gem-7000.webp";
import {
  CREDIT_PACKAGES,
  DEFAULT_PACKAGE_ID,
  DEMO_PURCHASE_NOTE,
  creditTopUp,
  formatPackageCredits,
} from "./creditStore.js";
import { releaseCreditAward, stageCreditAward } from "./creditAward.js";
import { playSound } from "./sound.js";

const PACKAGE_ART = {
  "gem-500": { image: gem500, fit: "68%" },
  "gem-1200": { image: gem1200, fit: "80%" },
  "gem-3000": { image: gem3000, fit: "92%" },
  "gem-7000": { image: gem7000, fit: "100%" },
};

const BADGE_CLASS = {
  Popular: "credit-badge-popular",
  "Best value": "credit-badge-value",
};

function PackageCard({ pack, selected, onSelect, onKeyDown }) {
  const art = PACKAGE_ART[pack.art];
  return (
    <button
      id={`credit-pack-${pack.id}`}
      className="credit-card"
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      onClick={() => onSelect(pack.id)}
      onKeyDown={onKeyDown}
    >
      {pack.badge ? <span className={`credit-badge ${BADGE_CLASS[pack.badge] ?? ""}`}>{pack.badge}</span> : null}
      <span className="credit-select" aria-hidden="true">
        <svg viewBox="0 0 16 16">
          <path d="M3.2 8.2 6.3 11.1 12.8 4.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="credit-card-art" style={{ "--gem-fit": art.fit }}>
        <img src={art.image} alt="" />
      </span>
      <span className="credit-card-copy">
        <span className="credit-card-amount">{formatPackageCredits(pack.credits)}</span>
        <span className="credit-card-unit">credits</span>
      </span>
      <span className="credit-card-price">{pack.price}</span>
    </button>
  );
}

export default function GetCreditsPage({ credits, creditsText, onSetCredits, onBack, onPlay }) {
  const titleId = useId();
  const packsTitleId = useId();
  const confirmTitleId = useId();
  const applied = useRef(false);
  const confirmButton = useRef(null);
  const [selectedId, setSelectedId] = useState(DEFAULT_PACKAGE_ID);
  const [phase, setPhase] = useState("shop");
  const [receipt, setReceipt] = useState(null);
  const selected = CREDIT_PACKAGES.find((pack) => pack.id === selectedId) ?? CREDIT_PACKAGES[1];

  useEffect(() => {
    if (phase !== "confirm") return undefined;
    confirmButton.current?.focus();
    function onKey(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setPhase("shop");
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase]);

  function moveSelection(event) {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const index = CREDIT_PACKAGES.findIndex((pack) => pack.id === selected.id);
    const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const next = CREDIT_PACKAGES[(index + delta + CREDIT_PACKAGES.length) % CREDIT_PACKAGES.length];
    setSelectedId(next.id);
    document.getElementById(`credit-pack-${next.id}`)?.focus({ focusVisible: true });
  }

  function confirmPurchase() {
    const result = creditTopUp(credits, selected.credits, applied.current);
    if (!result.applied) return;
    applied.current = true;
    const awardId = stageCreditAward(selected.credits);
    onSetCredits(result.balance);
    releaseCreditAward(awardId);
    playSound("win");
    setReceipt(selected);
    setPhase("success");
  }

  return (
    <div className="credits-page">
      <div className="credits-heading">
        <button
          className="credit-back"
          type="button"
          onClick={onBack}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M13 8H3.8M7.8 4.2 3.8 8l4 3.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <h1 id={titleId}>Get Credits</h1>
        <p>Top up your virtual balance</p>
      </div>

      {phase === "success" && receipt ? (
        <section className="credit-success" role="status" aria-live="polite">
          <img className="credit-success-art" src={creditSuccessGem} alt="" />
          <h2>Credits added!</h2>
          <p className="credit-success-award">
            <span className="credit-success-amount">+{formatPackageCredits(receipt.credits)}</span>
            <span className="credit-success-unit">credits</span>
          </p>
          <p className="credit-success-balance">
            <span>New balance</span>
            <strong>{creditsText}</strong>
          </p>
          <Button onClick={onPlay}>
            Back to game
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 8h9.2M8.2 4.2 12.2 8l-4 3.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
          <p className="credit-success-note">Demo purchase. No real money charged.</p>
        </section>
      ) : (
        <>
          <section className="credit-balance-card" aria-label="Current balance">
            <p>Current balance</p>
            <strong>
              <img src={walletGem} alt="" />
              <span>{creditsText}</span>
            </strong>
          </section>

          <section className="credit-shop" aria-labelledby={packsTitleId}>
            <div className="credit-shop-head">
              <h2 id={packsTitleId}>Choose your pack</h2>
              <p className="credit-demo-badge">Demo store</p>
            </div>

            <div
              className="credit-packages"
              role="radiogroup"
              aria-labelledby={packsTitleId}
              aria-describedby="credit-demo-note"
            >
              {CREDIT_PACKAGES.map((pack) => (
                <PackageCard
                  key={pack.id}
                  pack={pack}
                  selected={pack.id === selected.id}
                  onSelect={setSelectedId}
                  onKeyDown={moveSelection}
                />
              ))}
            </div>

            <div className="credit-checkout">
              <div className="credit-checkout-facts" aria-live="polite">
                <p>
                  <span>Selected pack</span>
                  <strong>{formatPackageCredits(selected.credits)} credits</strong>
                </p>
                <p>
                  <span>Demo total</span>
                  <strong>{selected.price}</strong>
                </p>
              </div>
              <Button onClick={() => setPhase("confirm")}>Continue</Button>
            </div>
          </section>

          <p id="credit-demo-note" className="credit-demo-note">
            Demo only. No real money will be charged.
          </p>
        </>
      )}

      {phase === "confirm" ? (
        <div
          className="credit-modal-root"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPhase("shop");
          }}
        >
          <div
            className="credit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={confirmTitleId}
          >
            <p className="credit-modal-kicker">Selected package</p>
            <h2 id={confirmTitleId}>{formatPackageCredits(selected.credits)} credits</h2>
            <p className="credit-modal-price">{selected.price}</p>
            <p className="credit-demo-note">{DEMO_PURCHASE_NOTE}</p>
            <div className="credit-modal-actions">
              <Button variant="secondary" size="medium" onClick={() => setPhase("shop")}>
                Cancel
              </Button>
              <Button size="medium" ref={confirmButton} onClick={confirmPurchase}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
