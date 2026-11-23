import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import "./ProfilePage.css";
import Button from "./Button.jsx";
import TextField from "./TextField.jsx";
import avatar from "./assets/mines/avatar.png";
import walletGem from "./assets/mines/wallet-gem.svg";
import { displayNameError, readDisplayName, saveDisplayName } from "./profile.js";

const STATS = [
  { label: "Games played", value: "12" },
  { label: "Win rate", value: "67%" },
  { label: "Best multiplier", value: "2.48×" },
];

const ROUNDS = [
  { time: "14:32", bet: "50.00", multiplier: "2.48×", result: "+124.00", tone: "win" },
  { time: "14:29", bet: "25.00", multiplier: "—", result: "−25.00", tone: "loss" },
  { time: "14:11", bet: "50.00", multiplier: "1.14×", result: "+57.00", tone: "win" },
  { time: "13:54", bet: "10.00", multiplier: "—", result: "−10.00", tone: "loss" },
];

function px(value) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function visibleRoundCount(panel, profile, total) {
  const style = getComputedStyle(panel);
  const gap = px(style.rowGap) || px(style.gap);
  const heading = panel.querySelector(".profile-history-heading")?.offsetHeight ?? 0;
  const thead = panel.querySelector("thead")?.getBoundingClientRect().height ?? 0;
  const note = panel.querySelector(".profile-note");
  const noteBlock = note ? note.offsetHeight + gap : 0;
  const row = panel.querySelector("tbody tr");
  const rowHeight = row?.getBoundingClientRect().height ?? 0;
  const chrome = px(style.paddingTop) + px(style.paddingBottom) + heading + gap + thead + noteBlock;
  if (!(rowHeight > 0)) return total;

  const panelTop =
    panel.getBoundingClientRect().top - profile.getBoundingClientRect().top + profile.scrollTop;
  const room = profile.clientHeight - panelTop;
  // The table starts below the visible area, so the page scrolls to it.
  if (room < chrome + rowHeight) return total;
  return Math.max(0, Math.min(total, Math.floor((room - chrome) / rowHeight)));
}

export default function ProfilePage({ credits }) {
  const nameId = useId();
  const [displayName, setDisplayName] = useState(() => readDisplayName(localStorage));
  const [draftName, setDraftName] = useState(displayName);
  const [noticeId, setNoticeId] = useState(0);
  const [historyNote, setHistoryNote] = useState("");
  const [visibleCount, setVisibleCount] = useState(ROUNDS.length);
  const historyRef = useRef(null);

  const nameError = displayNameError(draftName);
  const trimmedDraft = draftName.trim();
  const canSave = !nameError && trimmedDraft !== displayName;

  useEffect(() => {
    if (!noticeId) return undefined;
    const timer = window.setTimeout(() => setNoticeId(0), 4000);
    return () => window.clearTimeout(timer);
  }, [noticeId]);

  useLayoutEffect(() => {
    const panel = historyRef.current;
    const profile = panel?.closest(".profile");
    if (!panel || !profile) return undefined;

    const measure = () => {
      const next = visibleRoundCount(panel, profile, ROUNDS.length);
      setVisibleCount((current) => (current === next ? current : next));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    observer.observe(profile);
    return () => observer.disconnect();
  }, [historyNote]);

  function saveName(event) {
    event.preventDefault();
    if (!canSave) return;
    const saved = saveDisplayName(localStorage, trimmedDraft);
    if (!saved) return;
    setDisplayName(saved);
    setDraftName(saved);
    setNoticeId((id) => id + 1);
  }

  return (
    <div className="profile">
      <div className="profile-heading">
        <div className="profile-title">
          <h1>Profile</h1>
        </div>
      </div>

      <section className="profile-identity" aria-label="Player">
        <img className="profile-avatar" src={avatar} alt="" width="56" height="56" />
        <div className="profile-identity-copy">
          <p className="profile-name">{displayName}</p>
          <p className="profile-role">Account</p>
        </div>
        <div className="profile-credits">
          <p>VIRTUAL CREDITS</p>
          <div className="profile-amount">
            <img src={walletGem} alt="" />
            <p>{credits}</p>
          </div>
        </div>
      </section>

      <section className="profile-stats" aria-label="Player statistics">
        {STATS.map((stat) => (
          <article className="profile-stat" key={stat.label}>
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <div className="profile-columns">
        <section className="profile-history" aria-labelledby="recent-rounds" ref={historyRef}>
          <div className="profile-history-heading">
            <h2 id="recent-rounds">Recent rounds</h2>
            {visibleCount < ROUNDS.length ? (
              <button
                className="profile-link"
                type="button"
                onClick={() => setHistoryNote("Every recorded round is already listed here.")}
              >
                View all →
              </button>
            ) : null}
          </div>
          <div className="profile-table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Time</th>
                  <th scope="col">Bet</th>
                  <th scope="col">Multiplier</th>
                  <th className="profile-result" scope="col">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROUNDS.slice(0, visibleCount).map((round) => (
                  <tr key={`${round.time}-${round.bet}`}>
                    <td>{round.time}</td>
                    <td>{round.bet}</td>
                    <td>{round.multiplier}</td>
                    <td className={`profile-result profile-result-${round.tone}`}>
                      {round.result}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {historyNote ? (
            <p className="profile-note" role="status">
              {historyNote}
            </p>
          ) : null}
        </section>

        <section className="profile-account" aria-labelledby="profile-settings">
          <h2 id="profile-settings">Profile settings</h2>
          <form className="profile-form" onSubmit={saveName}>
            <div className="profile-name-field">
              <TextField
                id={nameId}
                label="Display name"
                value={draftName}
                error={nameError && trimmedDraft !== displayName ? nameError : ""}
                onChange={(event) => setDraftName(event.target.value)}
                autoComplete="nickname"
                maxLength={24}
              />
              <p className="profile-saved" role="status">
                {noticeId ? (
                  <>
                    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
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
                    Profile updated
                  </>
                ) : null}
              </p>
            </div>
            <div className="profile-actions">
              <Button className="profile-button" type="submit" disabled={!canSave}>
                Save changes
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
