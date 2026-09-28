import type { HTMLAttributes } from "react"
import { cn } from "@/lib/cn"

export type SurfaceVariant = "floating" | "panel"

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant
}

const VARIANT_CLASS: Record<SurfaceVariant, string> = {
  /** Translucent card floating over the map: controls, legend, search. */
  floating: "rounded-lg bg-overlay shadow-float ring-1 ring-inset ring-line-subtle backdrop-blur-md",
  /** Opaque surface for dense content: detail panel, reserve flow. */
  panel: "rounded-xl bg-surface shadow-float ring-1 ring-inset ring-line-subtle",
}

export function Surface({ variant = "floating", className, ...rest }: SurfaceProps) {
  return <div className={cn(VARIANT_CLASS[variant], className)} {...rest} />
}
