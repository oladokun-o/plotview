import { useId } from "react"

interface AvailabilityBarProps {
  x: number
  y: number
  width: number
  available: number
  reserved: number
  total: number
}

const HEIGHT = 4

/** A thin bar split into available, reserved and occupied shares of a section. */
export function AvailabilityBar({ x, y, width, available, reserved, total }: AvailabilityBarProps) {
  const safeTotal = Math.max(total, 1)
  const availableWidth = (available / safeTotal) * width
  const reservedWidth = (reserved / safeTotal) * width
  // useId output can contain characters that break url(#...) references.
  const clipId = `bar${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`

  return (
    <g transform={`translate(${x}, ${y})`} aria-hidden="true">
      <clipPath id={clipId}>
        <rect width={width} height={HEIGHT} rx={HEIGHT / 2} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect width={width} height={HEIGHT} className="fill-occupied-edge/60" />
        <rect width={availableWidth} height={HEIGHT} className="fill-available-edge" />
        <rect x={availableWidth} width={reservedWidth} height={HEIGHT} className="fill-reserved-edge" />
      </g>
    </g>
  )
}
