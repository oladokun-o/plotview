import type { ReactNode } from "react"
import { cn } from "@/lib/cn"

export type BadgeTone = "neutral" | "available" | "reserved" | "occupied"

interface BadgeProps {
  tone?: BadgeTone
  icon?: ReactNode
  className?: string
  children: ReactNode
}

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-sunken text-secondary ring-line-subtle",
  available: "bg-available text-available-mark ring-available-edge/40",
  reserved: "bg-reserved text-reserved-mark ring-reserved-edge/40",
  occupied: "bg-occupied text-occupied-mark ring-occupied-edge/40",
}

export function Badge({ tone = "neutral", icon, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        TONE_CLASS[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
