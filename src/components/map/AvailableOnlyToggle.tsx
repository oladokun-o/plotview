interface AvailableOnlyToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function AvailableOnlyToggle({ checked, onChange }: AvailableOnlyToggleProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-primary">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-line accent-accent"
      />
      Available only
    </label>
  )
}
