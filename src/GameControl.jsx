import "./button.css";

export default function GameControl({
  selected,
  className = "",
  type = "button",
  onClick,
  children,
  ...props
}) {
  const toggle = typeof selected === "boolean";
  const classes = ["game-control", toggle && selected ? "is-selected" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      type={type}
      className={classes}
      aria-pressed={toggle ? String(selected) : undefined}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
