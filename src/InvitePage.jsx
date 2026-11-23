import { useRef, useState } from "react";
import "./InvitePage.css";
import Button from "./Button.jsx";
import gemIcon from "./assets/mines/gem.svg";
import inviteCharacters from "./assets/mines/invite-characters.webp";
import inviteGift from "./assets/mines/invite-gift.webp";
import { INVITE_BONUS_CREDITS, inviteUrl, readInviteCode } from "./invite.js";

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10.2 13.2a4.2 4.2 0 0 0 5.9.1l1.2-1.2a4.2 4.2 0 0 0-5.9-5.9l-.7.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M13.8 10.8a4.2 4.2 0 0 0-5.9-.1l-1.2 1.2a4.2 4.2 0 0 0 5.9 5.9l.7-.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3.6 18.4c.5-2.5 2.4-4 5.4-4s4.9 1.5 5.4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path d="M17.5 8.5v5M15 11h5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3.4 17.6c.4-2.2 2.1-3.5 5.1-3.5s4.7 1.3 5.1 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="16.4" cy="9.2" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M14.8 14.6c1.4-.4 2.7-.2 3.8.7.8.7 1.2 1.6 1.4 2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StepArrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 12h12M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STEPS = [
  {
    title: "1. Share your link",
    text: "Send your invite link to a friend.",
    icon: <LinkIcon />,
  },
  {
    title: "2. Friend joins Minex",
    text: "Your friend signs up using your link.",
    icon: <UserPlusIcon />,
  },
  {
    title: `3. Get ${INVITE_BONUS_CREDITS} credits`,
    text: `Earn ${INVITE_BONUS_CREDITS} credits for a successful referral.`,
    icon: <img src={gemIcon} alt="" />,
  },
];

export default function InvitePage() {
  const linkField = useRef(null);
  const [code] = useState(() => readInviteCode(localStorage));
  const [notice, setNotice] = useState("");
  const link = inviteUrl(window.location.origin, code);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setNotice("Link copied.");
      return;
    } catch {
      // The field stays selectable when the browser blocks clipboard access.
    }
    const field = linkField.current;
    if (!field) return;
    field.focus();
    field.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    setNotice(copied ? "Link copied." : "Link selected. Copy it from the field.");
  }

  return (
    <div className="page-scroll invite-page">
      <div className="game-title">
        <h1>Invite friends</h1>
      </div>

      <section className="panel invite-card" aria-labelledby="invite-title">
        <div className="invite-copy">
          <p className="invite-badge">
            <img src={gemIcon} alt="" />
            INVITE &amp; EARN
          </p>
          <h2 id="invite-title">
            Invite a friend. Get <span>{INVITE_BONUS_CREDITS} credits.</span>
          </h2>
          <p className="invite-lead">Share your link with friends and earn rewards when they join Minex.</p>
          <div className="invite-link-row">
            <input
              ref={linkField}
              readOnly
              value={link}
              aria-label="Invite link"
              onFocus={(event) => event.target.select()}
            />
            <Button variant="secondary" size="small" className="home-action" onClick={onCopy}>
              Copy link
            </Button>
          </div>
          <p className="invite-copied" role="status">
            {notice}
          </p>
        </div>
        <img className="invite-art" src={inviteCharacters} alt="" />
      </section>

      <section className="invite-steps" aria-labelledby="invite-steps-title">
        <h2 id="invite-steps-title">How it works</h2>
        <div className="invite-steps-row">
          {STEPS.map((step, index) => (
            <div className="invite-step-slot" key={step.title}>
              {index > 0 ? (
                <span className="invite-step-arrow" aria-hidden="true">
                  <StepArrow />
                </span>
              ) : null}
              <article className="invite-step">
                <span className="invite-step-icon">{step.icon}</span>
                <div className="invite-step-copy">
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </article>
            </div>
          ))}
        </div>
      </section>

      <section className="invite-extra">
        <article className="invite-invites">
          <div className="invite-invites-head">
            <span className="invite-invites-icon" aria-hidden="true">
              <UsersIcon />
            </span>
            <div className="invite-invites-copy">
              <div className="invite-invites-title">
                <h2>Your invitations</h2>
                <span className="invite-demo">Demo</span>
              </div>
              <p>Track your invited friends and rewards.</p>
            </div>
          </div>
          <div className="invite-metrics">
            <div className="invite-metric">
              <strong>0</strong>
              <span>Friends joined</span>
            </div>
            <div className="invite-metric">
              <strong>
                <img src={gemIcon} alt="" />
                0
              </strong>
              <span>Credits earned</span>
            </div>
          </div>
        </article>

        <article className="invite-more">
          <img className="invite-gift" src={inviteGift} alt="" />
          <div className="invite-more-copy">
            <h2>Invite more friends</h2>
            <p>The more friends you invite, the more credits you can earn!</p>
          </div>
        </article>
      </section>
    </div>
  );
}
