import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/cn"

interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  icon?: ReactNode
}

/** A toggle chip: a filter or mode that is either on or off. */
export function Chip({ pressed, onPressedChange, icon, className, children, type = "button", ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "inline-flex h-9 select-none items-center gap-1.5 rounded-full px-3.5 text-sm font-medium whitespace-nowrap",
        "shadow-float ring-1 ring-inset backdrop-blur-md",
        "transition-[background-color,color,box-shadow] duration-150 ease-standard",
        pressed
          ? "bg-accent text-on-accent ring-transparent hover:bg-accent-hover"
          : "bg-overlay text-primary ring-line-subtle hover:bg-raised",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
