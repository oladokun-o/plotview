import type { InputHTMLAttributes, Ref } from "react"
import { cn } from "@/lib/cn"
import { FieldShell, describedBy } from "./FieldShell"

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "onChange"> {
  id: string
  label: string
  value: string
  onValueChange: (value: string) => void
  optional?: boolean
  hint?: string
  error?: string
  ref?: Ref<HTMLInputElement>
}

export const CONTROL_CLASS =
  "h-11 w-full rounded-md bg-surface px-3 text-[15px] text-primary ring-1 ring-inset outline-none transition-shadow duration-150 placeholder:text-tertiary focus:ring-2 focus:ring-focus"

export function TextField({ id, label, value, onValueChange, optional, hint, error, className, ref, ...rest }: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} optional={optional} hint={hint} error={error}>
      <input
        ref={ref}
        id={id}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(CONTROL_CLASS, error ? "ring-danger-edge" : "ring-line", className)}
        {...rest}
      />
    </FieldShell>
  )
}
