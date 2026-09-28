import { ChevronDown } from "lucide-react"
import type { SelectHTMLAttributes } from "react"
import { cn } from "@/lib/cn"
import { FieldShell, describedBy } from "./FieldShell"
import { CONTROL_CLASS } from "./TextField"

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "onChange"> {
  id: string
  label: string
  value: string
  onValueChange: (value: string) => void
  options: readonly string[]
  placeholder: string
  optional?: boolean
  hint?: string
  error?: string
}

/** A native select, so it gets the platform's own picker on phones. */
export function SelectField({
  id,
  label,
  value,
  onValueChange,
  options,
  placeholder,
  optional,
  hint,
  error,
  ...rest
}: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} optional={optional} hint={hint} error={error}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={cn(CONTROL_CLASS, "appearance-none pr-9", value ? "text-primary" : "text-tertiary", error ? "ring-danger-edge" : "ring-line-control")}
          {...rest}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-tertiary" />
      </div>
    </FieldShell>
  )
}
