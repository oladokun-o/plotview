import { cn } from "@/lib/cn"

interface SpinnerProps {
  size?: number
  className?: string
  label?: string
}

/** Quiet circular progress indicator. Decorative unless a label is given. */
export function Spinner({ size = 16, className, label }: SpinnerProps) {
  const stroke = Math.max(1.5, size / 10)
  const radius = (size - stroke) / 2

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("motion-safe:animate-spin", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeOpacity={0.2} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${Math.PI * radius * 0.6} ${Math.PI * radius * 2}`}
      />
    </svg>
  )
}
