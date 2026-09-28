import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/cn"

export type IconButtonVariant = "floating" | "ghost"

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name; icon-only buttons have no visible text. */
  label: string
  icon: ReactNode
  variant?: IconButtonVariant
  size?: "sm" | "md"
}

const VARIANT_CLASS: Record<IconButtonVariant, string> = {
  floating: "bg-overlay text-primary shadow-float ring-1 ring-inset ring-line-subtle backdrop-blur-md hover:bg-raised",
  ghost: "text-secondary hover:bg-sunken hover:text-primary",
}

export function IconButton({
  label,
  icon,
  variant = "floating",
  size = "md",
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md",
        "transition-[background-color,color,transform] duration-150 ease-standard active:scale-95",
        "disabled:pointer-events-none disabled:opacity-40",
        size === "md" ? "size-10" : "size-8",
        VARIANT_CLASS[variant],
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  )
}
