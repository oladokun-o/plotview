/** Axis-aligned rectangle in map content coordinates. */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** Space taken by floating UI on each edge of the viewport, in pixels. */
export interface Insets {
  top: number
  right: number
  bottom: number
  left: number
}

export const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 }

export function rectCenter(rect: Rect): [number, number] {
  return [rect.x + rect.width / 2, rect.y + rect.height / 2]
}

export function unionRects(rects: Rect[]): Rect {
  if (rects.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const rect of rects) {
    minX = Math.min(minX, rect.x)
    minY = Math.min(minY, rect.y)
    maxX = Math.max(maxX, rect.x + rect.width)
    maxY = Math.max(maxY, rect.y + rect.height)
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/** Rotates a point clockwise by `degrees` around an origin (SVG convention, y down). */
export function rotatePoint(x: number, y: number, degrees: number, originX = 0, originY = 0): [number, number] {
  if (degrees === 0) {
    return [x, y]
  }
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const dx = x - originX
  const dy = y - originY
  return [originX + dx * cos - dy * sin, originY + dx * sin + dy * cos]
}

/** Bounding box of a rectangle after rotating it around (originX, originY). */
export function rotatedBounds(rect: Rect, degrees: number, originX: number, originY: number): Rect {
  const corners: [number, number][] = [
    [rect.x, rect.y],
    [rect.x + rect.width, rect.y],
    [rect.x, rect.y + rect.height],
    [rect.x + rect.width, rect.y + rect.height],
  ]
  const rotated = corners.map(([x, y]) => rotatePoint(x, y, degrees, originX, originY))
  const xs = rotated.map(([x]) => x)
  const ys = rotated.map(([, y]) => y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  return { x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY }
}
