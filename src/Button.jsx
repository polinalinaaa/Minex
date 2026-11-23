import "./button.css";

export default function Button({
  variant = "primary",
  size = "large",
  wide = false,
  loading = false,
  className = "",
  type = "button",
  disabled = false,
  onClick,
  children,
  ...props
}) {
  const busy = Boolean(loading);
  const classes = [
    "btn",
    variant === "secondary" ? "btn-secondary" : "btn-primary",
    size === "small" ? "btn-sm" : size === "medium" ? "btn-md" : "btn-lg",
    wide ? "btn-wide" : "",
    busy ? "is-loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      type={type}
      className={classes}
      disabled={disabled || busy}
      aria-busy={busy ? "true" : undefined}
      onClick={onClick}
    >
      <span className="btn-label">{children}</span>
      {busy ? <span className="btn-spinner" aria-hidden="true" /> : null}
    </button>
  );
}
