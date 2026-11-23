import { useEffect, useId, useRef, useState } from "react";
import { getSoundPrefs, installSound, setSoundMuted, setSoundVolume, subscribeSound } from "./sound.js";

function SpeakerIcon({ muted }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9.5h3.2L12 5.8v12.4l-4.8-3.7H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" fill="currentColor" />
      {muted ? (
        <path d="M16 9.2 20.8 14m0-4.8L16 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <path d="M16.2 8.8a4.2 4.2 0 0 1 0 6.4M18.6 6.6a7.2 7.2 0 0 1 0 10.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      )}
    </svg>
  );
}

export default function SoundControl() {
  const panelId = useId();
  const rootRef = useRef(null);
  const closeTimer = useRef(0);
  const [prefs, setPrefs] = useState(getSoundPrefs);
  const [open, setOpen] = useState(false);

  useEffect(() => installSound(), []);

  useEffect(() => subscribeSound(setPrefs), []);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function toggle() {
    setSoundMuted(!prefs.muted);
  }

  function onVolume(event) {
    const volume = Number(event.target.value) / 100;
    setSoundVolume(volume);
    if (volume > 0 && prefs.muted) setSoundMuted(false);
  }

  function closeSoon(event) {
    if (event.relatedTarget && rootRef.current?.contains(event.relatedTarget)) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      const root = rootRef.current;
      if (!root) return;
      if (root.matches(":hover") || root.contains(document.activeElement)) return;
      setOpen(false);
    }, 180);
  }

  function leavePointer(event) {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    closeSoon(event);
  }

  const percent = Math.round(prefs.volume * 100);

  return (
    <div
      className={open ? "sound-control is-open" : "sound-control"}
      ref={rootRef}
      onMouseEnter={() => {
        window.clearTimeout(closeTimer.current);
        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) setOpen(true);
      }}
      onMouseLeave={leavePointer}
      onBlur={closeSoon}
    >
      <button
        className={prefs.muted ? "sound-toggle is-muted" : "sound-toggle"}
        type="button"
        aria-pressed={!prefs.muted}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={prefs.muted ? "Unmute sound" : "Mute sound"}
        onClick={toggle}
        onFocus={() => {
          window.clearTimeout(closeTimer.current);
          setOpen(true);
        }}
      >
        <SpeakerIcon muted={prefs.muted} />
      </button>
      <div className="sound-popover" id={panelId} hidden={!open}>
        <div className="sound-popover-card" role="group" aria-label="Volume">
          <label htmlFor={`${panelId}-volume`}>Volume</label>
          <input
            id={`${panelId}-volume`}
            className="sound-volume"
            type="range"
            min="0"
            max="100"
            step="1"
            value={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-valuetext={`${percent}%`}
            onChange={onVolume}
          />
          <span>{percent}%</span>
        </div>
      </div>
    </div>
  );
}
