export default function RewardStatus({ status, timerOnly = false }) {
  if (status.state === "available") {
    return (
      <p className="reward-status reward-status-open">
        <span className="reward-status-check" aria-hidden="true">
          <svg viewBox="0 0 16 16" focusable="false">
            <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M4.8 8.2 7 10.4l4.4-4.6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        Available now
      </p>
    );
  }

  return (
    <p className={timerOnly ? "reward-status reward-status-wait" : "reward-status reward-status-claimed"}>
      {timerOnly ? null : <span className="reward-status-label">Claimed</span>}
      <span className="reward-status-time" aria-label={`Next in ${status.countdown}`}>
        Next in {status.countdown}
      </span>
    </p>
  );
}
