import type { Landmark } from "@/types/layout"
import { screenSizedLabel } from "./mapLabelStyle"

interface LandmarkLabelsProps {
  landmarks: Landmark[]
}

/**
 * Landmark names at a constant on-screen size, above trees so nothing hides them.
 * Buildings and the gate are labelled just below their shape, as on a printed
 * map, so the roof stays readable; an open area such as parking is labelled
 * inside. Hidden at overview zoom, where section names matter more.
 */
export function LandmarkLabels({ landmarks }: LandmarkLabelsProps) {
  return (
    <g
      className="pointer-events-none group-data-[zoom=far]/scene:hidden"
      data-arrival="fade"
      style={{ animationDelay: "900ms" }}
    >
      {landmarks.map((landmark) => {
        const inside = landmark.kind === "parking"
        return (
          <text
            key={landmark.id}
            x={landmark.x + landmark.width / 2}
            y={inside ? landmark.y + landmark.height / 2 : landmark.y + landmark.height}
            dy={inside ? undefined : "1em"}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-map-label stroke-map-label-halo font-medium"
            style={screenSizedLabel(12, Math.max(landmark.width / 5, 14))}
          >
            {landmark.label}
          </text>
        )
      })}
    </g>
  )
}
