import layoutData from "@/data/layout.json"
import type { Landmark, Layout, Package, Path, Plot, PlotStatus, Section } from "@/types/layout"

const PLOT_STATUSES: PlotStatus[] = ["available", "reserved", "occupied"]

export class LayoutValidationError extends Error {}

export type LayoutLoadResult =
  | { success: true; layout: Layout }
  | { success: false; error: string }

export function loadLayout(raw: unknown = layoutData): LayoutLoadResult {
  try {
    return { success: true, layout: validateLayout(raw) }
  } catch (error) {
    if (error instanceof LayoutValidationError) {
      return { success: false, error: error.message }
    }
    throw error
  }
}

export function validateLayout(raw: unknown): Layout {
  const root = expectRecord(raw, "layout")

  const site = expectRecord(root.site, "layout.site")
  const validatedSite = {
    name: expectString(site.name, "layout.site.name"),
    currency: expectString(site.currency, "layout.site.currency"),
    width: expectPositiveNumber(site.width, "layout.site.width"),
    height: expectPositiveNumber(site.height, "layout.site.height"),
  }

  const landmarks = expectArray(root.landmarks, "layout.landmarks").map((item, index) =>
    validateLandmark(item, `layout.landmarks[${index}]`),
  )
  assertUniqueIds(landmarks, "layout.landmarks")

  const paths = expectArray(root.paths, "layout.paths").map((item, index) =>
    validatePath(item, `layout.paths[${index}]`),
  )
  assertUniqueIds(paths, "layout.paths")

  const sections = expectArray(root.sections, "layout.sections").map((item, index) =>
    validateSection(item, `layout.sections[${index}]`),
  )
  assertUniqueIds(sections, "layout.sections")

  const allPlotIds = sections.flatMap((section) => section.plots.map((plot) => plot.id))
  assertUniqueIds(
    allPlotIds.map((id) => ({ id })),
    "layout.sections[].plots",
  )

  const packages = expectArray(root.packages, "layout.packages").map((item, index) =>
    validatePackage(item, `layout.packages[${index}]`),
  )
  assertUniqueIds(packages, "layout.packages")

  return { site: validatedSite, landmarks, paths, sections, packages }
}

function validateLandmark(raw: unknown, path: string): Landmark {
  const value = expectRecord(raw, path)
  return {
    id: expectString(value.id, `${path}.id`),
    label: expectString(value.label, `${path}.label`),
    x: expectNumber(value.x, `${path}.x`),
    y: expectNumber(value.y, `${path}.y`),
    width: expectPositiveNumber(value.width, `${path}.width`),
    height: expectPositiveNumber(value.height, `${path}.height`),
  }
}

function validatePath(raw: unknown, path: string): Path {
  const value = expectRecord(raw, path)
  const points = expectArray(value.points, `${path}.points`).map((point, index) =>
    validatePoint(point, `${path}.points[${index}]`),
  )
  if (points.length < 2) {
    fail(`${path}.points`, "must contain at least 2 points")
  }
  return { id: expectString(value.id, `${path}.id`), points }
}

function validatePoint(raw: unknown, path: string): [number, number] {
  if (!Array.isArray(raw) || raw.length !== 2) {
    fail(path, "must be a [number, number] pair")
  }
  return [expectNumber(raw[0], `${path}[0]`), expectNumber(raw[1], `${path}[1]`)]
}

function validateSection(raw: unknown, path: string): Section {
  const value = expectRecord(raw, path)
  const rows = expectPositiveInteger(value.rows, `${path}.rows`)
  const cols = expectPositiveInteger(value.cols, `${path}.cols`)

  const plots = expectArray(value.plots, `${path}.plots`).map((item, index) =>
    validatePlot(item, `${path}.plots[${index}]`, rows, cols),
  )
  assertUniqueIds(plots, `${path}.plots`)

  return {
    id: expectString(value.id, `${path}.id`),
    name: expectString(value.name, `${path}.name`),
    x: expectNumber(value.x, `${path}.x`),
    y: expectNumber(value.y, `${path}.y`),
    rows,
    cols,
    plotSize: expectPositiveNumber(value.plotSize, `${path}.plotSize`),
    gap: expectNumber(value.gap, `${path}.gap`),
    plots,
  }
}

function validatePlot(raw: unknown, path: string, rows: number, cols: number): Plot {
  const value = expectRecord(raw, path)
  const row = expectPositiveInteger(value.row, `${path}.row`)
  const col = expectPositiveInteger(value.col, `${path}.col`)

  if (row > rows) {
    fail(`${path}.row`, `${row} exceeds the section's ${rows} rows`)
  }
  if (col > cols) {
    fail(`${path}.col`, `${col} exceeds the section's ${cols} cols`)
  }

  const status = expectString(value.status, `${path}.status`)
  if (!isPlotStatus(status)) {
    fail(`${path}.status`, `expected one of ${PLOT_STATUSES.join(", ")}, got "${status}"`)
  }

  return {
    id: expectString(value.id, `${path}.id`),
    row,
    col,
    status,
    basePrice: expectPositiveNumber(value.basePrice, `${path}.basePrice`),
  }
}

function validatePackage(raw: unknown, path: string): Package {
  const value = expectRecord(raw, path)
  return {
    id: expectString(value.id, `${path}.id`),
    name: expectString(value.name, `${path}.name`),
    description: expectString(value.description, `${path}.description`),
    priceMultiplier: expectPositiveNumber(value.priceMultiplier, `${path}.priceMultiplier`),
  }
}

function isPlotStatus(value: string): value is PlotStatus {
  return (PLOT_STATUSES as string[]).includes(value)
}

function fail(path: string, message: string): never {
  throw new LayoutValidationError(`${path}: ${message}`)
}

function expectRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(path, "expected an object")
  }
  return value as Record<string, unknown>
}

function expectArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    fail(path, "expected an array")
  }
  return value
}

function expectString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0) {
    fail(path, "expected a non-empty string")
  }
  return value
}

function expectNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(path, "expected a finite number")
  }
  return value
}

function expectPositiveNumber(value: unknown, path: string): number {
  const number = expectNumber(value, path)
  if (number <= 0) {
    fail(path, "expected a number greater than 0")
  }
  return number
}

function expectPositiveInteger(value: unknown, path: string): number {
  const number = expectPositiveNumber(value, path)
  if (!Number.isInteger(number)) {
    fail(path, "expected a whole number")
  }
  return number
}

function assertUniqueIds(items: { id: string }[], path: string): void {
  const seen = new Set<string>()
  for (const item of items) {
    if (seen.has(item.id)) {
      fail(path, `duplicate id "${item.id}"`)
    }
    seen.add(item.id)
  }
}
