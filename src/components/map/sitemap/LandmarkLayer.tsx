import type { Landmark } from "@/types/layout"

interface LandmarkLayerProps {
  landmarks: Landmark[]
}

/** Buildings and named places. Parking is an outlined area rather than a building. */
export function LandmarkLayer({ landmarks }: LandmarkLayerProps) {
  return (
    <g>
      {landmarks.map((landmark) => {
        const centerX = landmark.x + landmark.width / 2
        const centerY = landmark.y + landmark.height / 2
        const isArea = landmark.kind === "parking"
        return (
          <g
            key={landmark.id}
            transform={landmark.rotation ? `rotate(${landmark.rotation} ${centerX} ${centerY})` : undefined}
            role="img"
            aria-label={landmark.label}
          >
            {!isArea && (
              <rect
                x={landmark.x + 3}
                y={landmark.y + 5}
                width={landmark.width}
                height={landmark.height}
                rx={4}
                className="fill-map-shadow"
              />
            )}
            <rect
              x={landmark.x}
              y={landmark.y}
              width={landmark.width}
              height={landmark.height}
              rx={4}
              className={isArea ? "fill-none stroke-map-building-edge" : "fill-map-building stroke-map-building-edge"}
              strokeWidth={1.5}
              strokeDasharray={isArea ? "6 5" : undefined}
            />
            <text
              x={centerX}
              y={centerY}
              textAnchor="middle"
              dominantBaseline="central"
              className="pointer-events-none fill-map-label text-[15px] font-medium"
            >
              {landmark.label}
            </text>
          </g>
        )
      })}
    </g>
  )
}
