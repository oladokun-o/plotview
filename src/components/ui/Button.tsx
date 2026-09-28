import type { ButtonHTMLAttributes, ReactNode, Ref } from "react"
import { cn } from "@/lib/cn"
import { Spinner } from "./Spinner"

export type ButtonVariant = "primary" | "secondary" | "ghost"
export type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  leadingIcon?: ReactNode
  ref?: Ref<HTMLButtonElement>
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "bg-raised text-primary ring-1 ring-inset ring-line hover:bg-sunken",
  ghost: "text-primary hover:bg-sunken",
}

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-sm px-3 text-sm",
  md: "h-10 gap-2 rounded-md px-4 text-sm",
  lg: "h-12 gap-2 rounded-md px-5 text-base",
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  leadingIcon,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex select-none items-center justify-center font-medium whitespace-nowrap",
        "transition-[background-color,box-shadow,opacity,transform] duration-150 ease-standard",
        "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner size={size === "lg" ? 18 : 16} /> : leadingIcon}
      {children}
    </button>
  )
}
