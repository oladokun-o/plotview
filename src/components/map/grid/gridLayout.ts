import type { Section } from "@/types/layout"

export const GRID_PLOT_SIZE = 28
export const GRID_PLOT_GAP = 6
export const GRID_SECTION_PADDING = 12
export const GRID_SECTION_HEADER_HEIGHT = 28
const SECTION_GAP = 40
const CANVAS_MARGIN = 16

export interface SectionBox {
  section: Section
  x: number
  y: number
  width: number
  height: number
}

export interface GridLayout {
  width: number
  height: number
  sections: SectionBox[]
}

export function computeGridLayout(sections: Section[]): GridLayout {
  let x = CANVAS_MARGIN
  let maxHeight = 0
  const boxes: SectionBox[] = []

  for (const section of sections) {
    const width = section.cols * GRID_PLOT_SIZE + (section.cols - 1) * GRID_PLOT_GAP + GRID_SECTION_PADDING * 2
    const height =
      GRID_SECTION_HEADER_HEIGHT +
      section.rows * GRID_PLOT_SIZE +
      (section.rows - 1) * GRID_PLOT_GAP +
      GRID_SECTION_PADDING * 2

    boxes.push({ section, x, y: CANVAS_MARGIN, width, height })
    x += width + SECTION_GAP
    maxHeight = Math.max(maxHeight, height)
  }

  return {
    width: Math.max(x - SECTION_GAP, 0) + CANVAS_MARGIN,
    height: maxHeight + CANVAS_MARGIN * 2,
    sections: boxes,
  }
}
