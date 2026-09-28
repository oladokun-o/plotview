import type { Insets, Rect } from "@/lib/geometry"

/** A pan/zoom state: content is scaled by `scale`, then offset by (x, y) pixels. */
export interface CameraTransform {
  x: number
  y: number
  scale: number
}

export interface Viewport {
  width: number
  height: number
  insets: Insets
}

export const CAMERA_MIN_SCALE = 0.05
export const CAMERA_MAX_SCALE = 8

/** The part of the viewport not covered by floating UI. */
function visibleArea({ width, height, insets }: Viewport): Rect {
  return {
    x: insets.left,
    y: insets.top,
    width: Math.max(width - insets.left - insets.right, 1),
    height: Math.max(height - insets.top - insets.bottom, 1),
  }
}

/**
 * The transform that shows `target` as large as possible inside the visible
 * area, filling at most `fill` of it (1 = edge to edge), capped at `maxScale`.
 */
export function frameRect(target: Rect, viewport: Viewport, fill = 0.92, maxScale = CAMERA_MAX_SCALE): CameraTransform {
  const area = visibleArea(viewport)
  const scale = Math.min(
    (area.width * fill) / Math.max(target.width, 1),
    (area.height * fill) / Math.max(target.height, 1),
    maxScale,
  )
  return {
    scale,
    x: area.x + area.width / 2 - (target.x + target.width / 2) * scale,
    y: area.y + area.height / 2 - (target.y + target.height / 2) * scale,
  }
}
