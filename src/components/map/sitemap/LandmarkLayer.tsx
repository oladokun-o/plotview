import type { Landmark } from "@/types/layout"

interface LandmarkLayerProps {
  landmarks: Landmark[]
}

const PARKING_BAY = 26

/** Buildings with a roof ridge, the gate as two posts and a bar, parking as marked bays. */
function LandmarkShape({ landmark }: { landmark: Landmark }) {
  const { x, y, width, height, kind } = landmark

  if (kind === "parking") {
    const bays = Math.max(Math.floor(width / PARKING_BAY), 1)
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} rx={4} className="fill-none stroke-map-building-edge" strokeWidth={1.5} strokeDasharray="6 5" />
        {Array.from({ length: bays - 1 }, (_, index) => (
          <line
            key={index}
            x1={x + (index + 1) * (width / bays)}
            x2={x + (index + 1) * (width / bays)}
            y1={y + 6}
            y2={y + height * 0.42}
            className="stroke-map-building-edge"
            strokeWidth={1}
          />
        ))}
      </g>
    )
  }

  if (kind === "gate") {
    const post = Math.min(height, 14)
    return (
      <g>
        <rect x={x} y={y + height / 2 - 2} width={width} height={4} rx={2} className="fill-map-building-edge" />
        <rect x={x - post / 2} y={y + height / 2 - post / 2} width={post} height={post} rx={2} className="fill-map-building stroke-map-building-edge" strokeWidth={1.5} />
        <rect x={x + width - post / 2} y={y + height / 2 - post / 2} width={post} height={post} rx={2} className="fill-map-building stroke-map-building-edge" strokeWidth={1.5} />
      </g>
    )
  }

  // A hip roof seen from above: the ridge runs along the long side and each
  // corner slopes up to its nearer end.
  const horizontal = width >= height
  const half = Math.min(width, height) / 2
  const ridgeStart: [number, number] = horizontal ? [x + half, y + height / 2] : [x + width / 2, y + half]
  const ridgeEnd: [number, number] = horizontal ? [x + width - half, y + height / 2] : [x + width / 2, y + height - half]
  const hips: [number, number, [number, number]][] = [
    [x, y, ridgeStart],
    [horizontal ? x : x + width, horizontal ? y + height : y, ridgeStart],
    [x + width, y + height, ridgeEnd],
    [horizontal ? x + width : x, horizontal ? y : y + height, ridgeEnd],
  ]
  return (
    <g>
      <rect x={x + 4} y={y + 6} width={width} height={height} rx={4} className="fill-map-shadow" />
      <rect x={x} y={y} width={width} height={height} rx={4} className="fill-map-building stroke-map-building-edge" strokeWidth={1.5} />
      <g className="stroke-map-building-edge" strokeWidth={1} strokeLinecap="round" opacity={0.7}>
        <line x1={ridgeStart[0]} y1={ridgeStart[1]} x2={ridgeEnd[0]} y2={ridgeEnd[1]} />
        {hips.map(([cornerX, cornerY, [endX, endY]], index) => (
          <line key={index} x1={cornerX} y1={cornerY} x2={endX} y2={endY} />
        ))}
      </g>
    </g>
  )
}

/** Buildings and named places. Their names are drawn separately, above the trees. */
export function LandmarkLayer({ landmarks }: LandmarkLayerProps) {
  return (
    <g aria-hidden="true">
      {landmarks.map((landmark, index) => {
        const centerX = landmark.x + landmark.width / 2
        const centerY = landmark.y + landmark.height / 2
        return (
          <g
            key={landmark.id}
            transform={landmark.rotation ? `rotate(${landmark.rotation} ${centerX} ${centerY})` : undefined}
          >
            <g data-arrival="rise" style={{ animationDelay: `${300 + index * 60}ms` }}>
              <LandmarkShape landmark={landmark} />
            </g>
          </g>
        )
      })}
    </g>
  )
}
