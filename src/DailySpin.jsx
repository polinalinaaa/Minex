import { useEffect, useRef, useState } from "react";
import "./DailySpin.css";
import Button from "./Button.jsx";
import gemIcon from "./assets/mines/rewards/spin-gem.webp";
import spinFrame from "./assets/mines/rewards/spin-frame.webp";
import spinPointer from "./assets/mines/rewards/spin-pointer.webp";
import { dropCreditAward, releaseCreditAward, stageCreditAward } from "./creditAward.js";
import { holdUiClick, playSound, playSpinTick, stopSpinTicks } from "./sound.js";
import {
  WHEEL_SECTORS,
  claimDailySpin,
  formatSpinCountdown,
  readSpin,
  sectorRotation,
  wheelSectorForReward,
} from "./dailySpin.js";

const SPIN_MS = 5200;
const STEP = 360 / WHEEL_SECTORS.length;
const OUTER = 96;
const INNER = 50;
const LABEL_R = 77;
const GAP_DEG = 0.78;
const CORNER = 3.6;
/** Light outer rim → dark inner rim. 12 sectors, period 5: last (cyan) meets first (raspberry). */
const CELL_GRADIENTS = [
  ["#EE42BC", "#86138F"],
  ["#18C8F4", "#0865BA"],
  ["#A052FF", "#5216B0"],
  ["#3478FF", "#1338A8"],
  ["#7660EF", "#352080"],
];

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function polar(radius, deg) {
  const angle = toRad(deg);
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

function sectorAngles(index) {
  const mid = -90 + index * STEP;
  const half = STEP / 2 - GAP_DEG / 2;
  return { mid, start: mid - half, end: mid + half };
}

/** Rounded annular sector: wider on the outer rim, sides aimed at the hub. */
function wedgePath(index) {
  const { start, end } = sectorAngles(index);
  const span = end - start;
  const outerCorner = Math.min(CORNER, ((OUTER * toRad(span)) / 2) * 0.45);
  const innerCorner = Math.min(CORNER * 0.85, ((INNER * toRad(span)) / 2) * 0.45);
  const outerPad = (outerCorner / OUTER) * (180 / Math.PI);
  const innerPad = (innerCorner / INNER) * (180 / Math.PI);

  const o0 = start + outerPad;
  const o1 = end - outerPad;
  const i0 = start + innerPad;
  const i1 = end - innerPad;

  const [ox0, oy0] = polar(OUTER, o0);
  const [ox1, oy1] = polar(OUTER, o1);
  const [ix1, iy1] = polar(INNER, i1);
  const [ix0, iy0] = polar(INNER, i0);

  const [rox0, roy0] = polar(OUTER - outerCorner, start);
  const [rox1, roy1] = polar(OUTER - outerCorner, end);
  const [rix1, riy1] = polar(INNER + innerCorner, end);
  const [rix0, riy0] = polar(INNER + innerCorner, start);

  const outerLarge = o1 - o0 > 180 ? 1 : 0;
  const innerLarge = i1 - i0 > 180 ? 1 : 0;

  return [
    `M ${rox0} ${roy0}`,
    `Q ${polar(OUTER, start).join(" ")} ${ox0} ${oy0}`,
    `A ${OUTER} ${OUTER} 0 ${outerLarge} 1 ${ox1} ${oy1}`,
    `Q ${polar(OUTER, end).join(" ")} ${rox1} ${roy1}`,
    `L ${rix1} ${riy1}`,
    `Q ${polar(INNER, end).join(" ")} ${ix1} ${iy1}`,
    `A ${INNER} ${INNER} 0 ${innerLarge} 0 ${ix0} ${iy0}`,
    `Q ${polar(INNER, start).join(" ")} ${rix0} ${riy0}`,
    "Z",
  ].join(" ");
}

function labelPose(index) {
  const { mid } = sectorAngles(index);
  const [x, y] = polar(LABEL_R, mid);
  return { x, y, mid };
}

function restingRotation(spin) {
  if (!spin || !Number.isInteger(spin.index)) return 0;
  return sectorRotation(0, spin.index, 0);
}

function easeOutQuart(t) {
  return 1 - (1 - t) ** 4;
}

export default function DailySpin({ credits, setCredits }) {
  const [spin, setSpin] = useState(() => readSpin(localStorage));
  const [rotation, setRotation] = useState(() => restingRotation(readSpin(localStorage)));
  const [spinning, setSpinning] = useState(false);
  const [revealed, setRevealed] = useState(() => {
    const saved = readSpin(localStorage);
    return Boolean(saved && saved.nextAt > Date.now());
  });
  const [now, setNow] = useState(() => Date.now());
  const busy = useRef(false);
  const frameRef = useRef(0);
  const mounted = useRef(true);
  const awardIdRef = useRef(0);

  const remaining = spin ? Math.max(0, spin.nextAt - now) : 0;
  const cooling = remaining > 0;
  const locked = spinning || cooling;
  const showOutcome = !spinning && revealed && spin && cooling;
  const showTimer = showOutcome;
  const winner = showOutcome ? wheelSectorForReward(spin.index) : -1;

  useEffect(() => {
    if (!cooling && !spinning) busy.current = false;
  }, [cooling, spinning]);

  useEffect(() => {
    if (!cooling) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [cooling]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      window.cancelAnimationFrame(frameRef.current);
      stopSpinTicks();
      if (awardIdRef.current) {
        const id = awardIdRef.current;
        awardIdRef.current = 0;
        dropCreditAward(id);
      }
    };
  }, []);

  function finish(nextSpin) {
    if (!mounted.current) return;
    setSpin(nextSpin);
    setSpinning(false);
    setRevealed(true);
    setNow(Date.now());
    const id = awardIdRef.current;
    awardIdRef.current = 0;
    if (id) releaseCreditAward(id);
    stopSpinTicks();
    playSound("win");
  }

  function onSpin() {
    if (busy.current || locked) return;
    const claimed = claimDailySpin(localStorage, credits, Date.now(), Math.random);
    if (!claimed.ok) {
      setSpin(claimed.spin);
      setRevealed(true);
      return;
    }
    busy.current = true;
    awardIdRef.current = stageCreditAward(claimed.spin.reward);
    setCredits(claimed.credits);
    setRevealed(false);
    const from = rotation;
    const target = sectorRotation(from, claimed.spin.index, 5);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setRotation(target);
      finish(claimed.spin);
      return;
    }
    holdUiClick();
    setSpinning(true);
    const start = performance.now();
    let lastSector = Math.floor(from / STEP);
    const step = (time) => {
      if (!mounted.current) return;
      const t = Math.min(1, (time - start) / SPIN_MS);
      const angle = from + (target - from) * easeOutQuart(t);
      setRotation(angle);
      const sector = Math.floor(angle / STEP);
      if (sector !== lastSector && t < 1) {
        lastSector = sector;
        playSpinTick();
      }
      if (t < 1) {
        frameRef.current = window.requestAnimationFrame(step);
        return;
      }
      setRotation(target);
      finish(claimed.spin);
    };
    frameRef.current = window.requestAnimationFrame(step);
  }

  return (
    <section className="panel daily-spin" aria-label="Daily Spin">
      <div className="daily-spin-heading">
        <p>One free spin every 24 hours</p>
      </div>
      <div className={showTimer ? "spin-board is-cooling" : "spin-board"}>
      <div className="spin-shell">
        <div className="spin-frame">
          <img className="spin-pointer" src={spinPointer} alt="" draggable={false} />
          <div className="spin-stage">
            <div
              className={winner >= 0 ? "spin-wheel-rotator has-winner" : "spin-wheel-rotator"}
              style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
            >
              <svg className="spin-wheel" viewBox="-100 -100 200 200" aria-hidden="true">
                <defs>
                  <filter id="spin-winner-glow" x="-35%" y="-35%" width="170%" height="170%">
                    <feGaussianBlur stdDeviation="1.4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  {CELL_GRADIENTS.map(([outer, inner], index) => (
                    <radialGradient
                      id={`spin-cell-${index}`}
                      key={`spin-cell-${index}`}
                      cx="0"
                      cy="0"
                      r={OUTER}
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0" stopColor={inner} />
                      <stop offset={INNER / OUTER} stopColor={inner} />
                      <stop offset="1" stopColor={outer} />
                    </radialGradient>
                  ))}
                </defs>
                {WHEEL_SECTORS.map((reward, index) => {
                  const won = index === winner;
                  return (
                    <path
                      className={won ? "spin-wedge is-winner" : "spin-wedge"}
                      d={wedgePath(index)}
                      fill={`url(#spin-cell-${index % CELL_GRADIENTS.length})`}
                      key={`wedge-${index}`}
                      filter={won ? "url(#spin-winner-glow)" : undefined}
                    />
                  );
                })}
              </svg>
              <div className="spin-labels" aria-hidden="true">
                {WHEEL_SECTORS.map((reward, index) => {
                  const { x, y } = labelPose(index);
                  const won = index === winner;
                  return (
                    <div
                      className={won ? "spin-label is-winner" : "spin-label"}
                      key={`label-${index}`}
                      style={{
                        left: `${50 + x / 2}%`,
                        top: `${50 + y / 2}%`,
                        transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
                      }}
                    >
                      <img className="spin-label-gem" src={gemIcon} alt="" />
                      <span className="spin-label-value">{reward}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <img className="spin-bezel" src={spinFrame} alt="" draggable={false} />
        </div>
      </div>
      <div className={showTimer ? "spin-hub-timer" : "spin-hub-timer is-idle"} role="status" aria-live="off">
        <p className="spin-hub-label">Next spin in</p>
        <p className="spin-hub-countdown">{showTimer ? formatSpinCountdown(remaining) : "00:00:00"}</p>
      </div>
      <div className="spin-footer">
        <Button
          wide
          className="spin-button"
          disabled={cooling}
          loading={spinning}
          onClick={onSpin}
        >
          Spin for free
        </Button>
      </div>
      </div>
    </section>
  );
}
