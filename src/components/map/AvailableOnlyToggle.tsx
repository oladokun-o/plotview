import { Chip } from "@/components/ui/Chip"

interface AvailableOnlyToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function AvailableOnlyToggle({ checked, onChange }: AvailableOnlyToggleProps) {
  return (
    <Chip pressed={checked} onPressedChange={onChange} className="pointer-events-auto">
      Available only
    </Chip>
  )
}
