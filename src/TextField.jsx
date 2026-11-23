import { useId } from "react";
import "./TextField.css";

export default function TextField({
  label,
  error = "",
  inputRef,
  id,
  className = "",
  ...props
}) {
  const autoId = useId();
  const fieldId = id || autoId;
  const errorId = `${fieldId}-error`;

  return (
    <div className={["text-field", error ? "text-field-invalid" : "", className].filter(Boolean).join(" ")}>
      <label className="text-field-label" htmlFor={fieldId}>
        {label}
      </label>
      <input
        {...props}
        ref={inputRef}
        id={fieldId}
        className="text-field-input"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? (
        <p className="text-field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
