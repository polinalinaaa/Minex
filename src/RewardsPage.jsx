import { useEffect } from "react";
import "./RewardsPage.css";
import DailySpin from "./DailySpin.jsx";

export default function RewardsPage({ credits, setCredits, focusId }) {
  useEffect(() => {
    if (!focusId) return undefined;
    const node = document.getElementById(focusId);
    if (!node) return undefined;
    node.scrollIntoView({ block: "start" });
    node.focus({ preventScroll: true });
    return undefined;
  }, [focusId]);

  return (
    <div className="page-scroll rewards-page">
      <div className="game-title">
        <h1 id="daily-spin-title">Daily Spin</h1>
      </div>

      <section id="daily-spin" className="reward-spin" tabIndex={-1} aria-labelledby="daily-spin-title">
        <DailySpin credits={credits} setCredits={setCredits} />
      </section>
    </div>
  );
}
