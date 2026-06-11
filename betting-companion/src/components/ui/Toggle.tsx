interface ToggleProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label?: string;
  readonly size?: "sm" | "md";
  readonly disabled?: boolean;
  readonly className?: string;
}

const TRACK_SIZES = {
  sm: "h-4 w-8",
  md: "h-5 w-10",
} as const;

const THUMB_SIZES = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
} as const;

const THUMB_TRANSLATE = {
  sm: "translate-x-4",
  md: "translate-x-5",
} as const;

export function Toggle({
  checked,
  onChange,
  label,
  size = "md",
  disabled = false,
  className = "",
}: ToggleProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label ? (
        <span className="text-xs uppercase tracking-[0.18em] text-secondary select-none">
          {label}
        </span>
      ) : null}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label ?? "Toggle"}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex shrink-0 cursor-pointer items-center rounded-full
          transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--noir)]
          ${TRACK_SIZES[size]}
          ${checked ? "bg-[var(--gold)]" : "bg-[var(--noir-border)]"}
          ${disabled ? "cursor-not-allowed opacity-40" : ""}
        `}
      >
        <span
          className={`
            inline-block rounded-full bg-white shadow-sm
            transition-transform duration-300 ease-in-out
            ${THUMB_SIZES[size]}
            ${checked ? THUMB_TRANSLATE[size] : "translate-x-0.5"}
          `}
        />
      </button>
    </div>
  );
}

export default Toggle;
