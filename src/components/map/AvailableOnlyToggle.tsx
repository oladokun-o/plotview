interface AvailableOnlyToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function AvailableOnlyToggle({ checked, onChange }: AvailableOnlyToggleProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-foreground/80">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-border-neutral accent-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plot-selected"
      />
      Available only
    </label>
  )
}
