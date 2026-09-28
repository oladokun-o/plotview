import type { Section } from "@/types/layout"
import { buildGeometry, placePlots, type MapGeometry, type SectionPlacement } from "../mapGeometry"

/** Grid view units. Independent of the site's own coordinates. */
export const GRID_CELL_WIDTH = 20
export const GRID_GAP = 6
export const GRID_SECTION_PADDING = 16
/** Name, availability and the availability bar above the plots. */
export const GRID_SECTION_HEADER = 44
/** Row numbers down the left edge. */
export const GRID_ROW_GUTTER = 16
const MAX_LENGTH_RATIO = 2
const SECTION_GAP = 40
const CANVAS_MARGIN = 24
/**
 * Generous per-character widths for the header's name (16px serif) and count
 * (10.5px sans). SVG text cannot be measured before it renders, so a section is
 * made wide enough for its header by estimate instead.
 */
const TITLE_CHAR_WIDTH = 8.5
const COUNT_CHAR_WIDTH = 6.4
const HEADER_TEXT_GAP = 16

export function cellLength(section: Section): number {
  const ratio = (section.plotLength ?? section.plotSize) / section.plotSize
  return GRID_CELL_WIDTH * Math.min(Math.max(ratio, 1), MAX_LENGTH_RATIO)
}

/** "12 of 60 available", as shown in a section's header. */
export function availabilityLabel(available: number, total: number): string {
  return `${available} of ${total} available`
}

/** Row numbers plus the plots, side to side. */
function plotsWidth(section: Section): number {
  return GRID_ROW_GUTTER + section.cols * GRID_CELL_WIDTH + (section.cols - 1) * GRID_GAP
}

/** Room the header needs, sized for the longest count so it never changes as plots are reserved. */
function headerWidth(section: Section): number {
  const total = section.plots.length
  return (
    section.name.length * TITLE_CHAR_WIDTH +
    HEADER_TEXT_GAP +
    availabilityLabel(total, total).length * COUNT_CHAR_WIDTH
  )
}

/**
 * How far the row numbers and plots are pushed in from the left padding: a
 * section with a long name or few columns is widened for its header, and its
 * plots are centred in the extra width.
 */
export function gridContentInset(section: Section): number {
  return Math.max(0, headerWidth(section) - plotsWidth(section)) / 2
}

function sectionSize(section: Section): { width: number; height: number } {
  return {
    width: Math.max(plotsWidth(section), headerWidth(section)) + GRID_SECTION_PADDING * 2,
    height:
      GRID_SECTION_HEADER +
      section.rows * cellLength(section) +
      (section.rows - 1) * GRID_GAP +
      GRID_SECTION_PADDING * 2,
  }
}

function packRows(sizes: { width: number; height: number }[], perRow: number) {
  const rows: number[][] = []
  for (let i = 0; i < sizes.length; i += perRow) {
    rows.push(sizes.slice(i, i + perRow).map((_, offset) => i + offset))
  }
  const rowWidths = rows.map((row) => row.reduce((sum, index) => sum + sizes[index].width, 0) + SECTION_GAP * (row.length - 1))
  const rowHeights = rows.map((row) => Math.max(...row.map((index) => sizes[index].height)))
  const width = Math.max(...rowWidths) + CANVAS_MARGIN * 2
  const height = rowHeights.reduce((sum, h) => sum + h, 0) + SECTION_GAP * (rows.length - 1) + CANVAS_MARGIN * 2
  return { rows, rowWidths, rowHeights, width, height }
}

/**
 * Arranges sections as blocks in wrapped rows, keeping the file's section order.
 * The number of blocks per row is chosen so the whole grid fits the viewport
 * as large as possible: stacked on a phone, side by side on a wide screen.
 */
export function computeGridLayout(sections: Section[], viewportAspect: number): MapGeometry {
  const sizes = sections.map(sectionSize)

  let best = packRows(sizes, 1)
  let bestScale = Math.min(viewportAspect / best.width, 1 / best.height)
  for (let perRow = 2; perRow <= sections.length; perRow++) {
    const candidate = packRows(sizes, perRow)
    const scale = Math.min(viewportAspect / candidate.width, 1 / candidate.height)
    if (scale > bestScale * 1.02) {
      best = candidate
      bestScale = scale
    }
  }

  const placements: SectionPlacement[] = []
  let y = CANVAS_MARGIN
  best.rows.forEach((row, rowIndex) => {
    let x = CANVAS_MARGIN + (best.width - CANVAS_MARGIN * 2 - best.rowWidths[rowIndex]) / 2
    for (const index of row) {
      const section = sections[index]
      const { width, height } = sizes[index]
      placements.push({
        section,
        x,
        y,
        rotation: 0,
        width,
        height,
        plots: placePlots(
          section,
          GRID_CELL_WIDTH,
          cellLength(section),
          GRID_GAP,
          GRID_SECTION_PADDING + gridContentInset(section) + GRID_ROW_GUTTER,
          GRID_SECTION_HEADER + GRID_SECTION_PADDING,
        ),
        bounds: { x, y, width, height },
      })
      x += width + SECTION_GAP
    }
    y += best.rowHeights[rowIndex] + SECTION_GAP
  })

  return buildGeometry(best.width, best.height, placements)
}
