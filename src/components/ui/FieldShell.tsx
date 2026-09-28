import type { ReactNode } from "react"

interface FieldShellProps {
  id: string
  label: string
  optional?: boolean
  hint?: string
  error?: string
  children: ReactNode
}

/** Label, hint and error around a form control. The ids it creates are what the control's aria-describedby points to. */
export function FieldShell({ id, label, optional, hint, error, children }: FieldShellProps) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-sm font-medium text-primary">
        {label}
        {optional && <span className="text-xs font-normal text-tertiary">Optional</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-secondary">
          {hint}
        </p>
      )}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs leading-snug text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

/** The aria-describedby value for a control inside FieldShell. */
export function describedBy(id: string, hint?: string, error?: string): string | undefined {
  const ids = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean)
  return ids.length > 0 ? ids.join(" ") : undefined
}
