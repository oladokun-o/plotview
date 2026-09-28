import layoutData from "@/data/layout.json"
import type {
  Ground,
  GroundKind,
  Landmark,
  LandmarkKind,
  Layout,
  Package,
  Path,
  PathKind,
  Plot,
  PlotStatus,
  Point,
  Section,
  Site,
  Tree,
  Underlay,
} from "@/types/layout"

const PLOT_STATUSES: readonly PlotStatus[] = ["available", "reserved", "occupied"]
const GROUND_KINDS: readonly GroundKind[] = ["lawn", "gravel", "water", "planting"]
const LANDMARK_KINDS: readonly LandmarkKind[] = ["gate", "chapel", "office", "parking", "other"]
const PATH_KINDS: readonly PathKind[] = ["road", "footpath"]

/** Where in the layout file a problem was found, and what it is. */
export interface LayoutIssue {
  path: string
  message: string
}

export class LayoutValidationError extends Error {
  constructor(readonly issue: LayoutIssue) {
    super(`${issue.path}: ${issue.message}`)
  }
}

export type LayoutLoadResult = { success: true; layout: Layout } | { success: false; issue: LayoutIssue }

export function loadLayout(raw: unknown = layoutData): LayoutLoadResult {
  try {
    return { success: true, layout: validateLayout(raw) }
  } catch (error) {
    if (error instanceof LayoutValidationError) {
      return { success: false, issue: error.issue }
    }
    throw error
  }
}

export function validateLayout(raw: unknown): Layout {
  const root = expectRecord(raw, "layout")

  const site = validateSite(root.site, "layout.site")
  const underlay = root.underlay === undefined ? undefined : validateUnderlay(root.underlay, "layout.underlay")

  const grounds = optionalArray(root.grounds, "layout.grounds").map((item, index) =>
    validateGround(item, `layout.grounds[${index}]`),
  )
  assertUniqueIds(grounds, "layout.grounds")

  const trees = optionalArray(root.trees, "layout.trees").map((item, index) =>
    validateTree(item, `layout.trees[${index}]`),
  )

  const landmarks = optionalArray(root.landmarks, "layout.landmarks").map((item, index) =>
    validateLandmark(item, `layout.landmarks[${index}]`),
  )
  assertUniqueIds(landmarks, "layout.landmarks")

  const paths = optionalArray(root.paths, "layout.paths").map((item, index) =>
    validatePath(item, `layout.paths[${index}]`),
  )
  assertUniqueIds(paths, "layout.paths")

  const sections = expectNonEmptyArray(root.sections, "layout.sections").map((item, index) =>
    validateSection(item, `layout.sections[${index}]`),
  )
  assertUniqueIds(sections, "layout.sections")

  const allPlotIds = sections.flatMap((section) => section.plots.map((plot) => plot.id))
  assertUniqueIds(
    allPlotIds.map((id) => ({ id })),
    "layout.sections[].plots",
  )

  const packages = expectNonEmptyArray(root.packages, "layout.packages").map((item, index) =>
    validatePackage(item, `layout.packages[${index}]`),
  )
  assertUniqueIds(packages, "layout.packages")

  return { site, underlay, grounds, trees, landmarks, paths, sections, packages }
}

function validateSite(raw: unknown, path: string): Site {
  const value = expectRecord(raw, path)
  const currency = expectString(value.currency, `${path}.currency`)
  if (!isCurrencyCode(currency)) {
    fail(`${path}.currency`, `"${currency}" is not an ISO 4217 currency code such as "USD"`)
  }
  return {
    name: expectString(value.name, `${path}.name`),
    currency,
    width: expectPositiveNumber(value.width, `${path}.width`),
    height: expectPositiveNumber(value.height, `${path}.height`),
  }
}

function validateUnderlay(raw: unknown, path: string): Underlay {
  const value = expectRecord(raw, path)
  const underlay: Underlay = {
    src: expectString(value.src, `${path}.src`),
    x: expectNumber(value.x, `${path}.x`),
    y: expectNumber(value.y, `${path}.y`),
    width: expectPositiveNumber(value.width, `${path}.width`),
    height: expectPositiveNumber(value.height, `${path}.height`),
  }
  if (value.opacity !== undefined) {
    const opacity = expectNumber(value.opacity, `${path}.opacity`)
    if (opacity < 0 || opacity > 1) {
      fail(`${path}.opacity`, "expected a number from 0 to 1")
    }
    underlay.opacity = opacity
  }
  return underlay
}

function validateGround(raw: unknown, path: string): Ground {
  const value = expectRecord(raw, path)
  return {
    id: expectString(value.id, `${path}.id`),
    kind: expectOneOf(value.kind, GROUND_KINDS, `${path}.kind`),
    points: validatePoints(value.points, `${path}.points`, 3),
  }
}

function validateTree(raw: unknown, path: string): Tree {
  const value = expectRecord(raw, path)
  return {
    x: expectNumber(value.x, `${path}.x`),
    y: expectNumber(value.y, `${path}.y`),
    radius: expectPositiveNumber(value.radius, `${path}.radius`),
  }
}

function validateLandmark(raw: unknown, path: string): Landmark {
  const value = expectRecord(raw, path)
  return {
    id: expectString(value.id, `${path}.id`),
    kind: expectOneOf(value.kind, LANDMARK_KINDS, `${path}.kind`),
    label: expectString(value.label, `${path}.label`),
    x: expectNumber(value.x, `${path}.x`),
    y: expectNumber(value.y, `${path}.y`),
    width: expectPositiveNumber(value.width, `${path}.width`),
    height: expectPositiveNumber(value.height, `${path}.height`),
    rotation: optionalNumber(value.rotation, `${path}.rotation`),
  }
}

function validatePath(raw: unknown, path: string): Path {
  const value = expectRecord(raw, path)
  return {
    id: expectString(value.id, `${path}.id`),
    kind: expectOneOf(value.kind, PATH_KINDS, `${path}.kind`),
    width: expectPositiveNumber(value.width, `${path}.width`),
    points: validatePoints(value.points, `${path}.points`, 2),
  }
}

function validatePoints(raw: unknown, path: string, minimum: number): Point[] {
  const points = expectArray(raw, path).map((point, index) => validatePoint(point, `${path}[${index}]`))
  if (points.length < minimum) {
    fail(path, `must contain at least ${minimum} points`)
  }
  return points
}

function validatePoint(raw: unknown, path: string): Point {
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

  const occupiedCells = new Map<string, string>()
  for (const plot of plots) {
    const cell = `${plot.row},${plot.col}`
    const other = occupiedCells.get(cell)
    if (other) {
      fail(`${path}.plots`, `plots "${other}" and "${plot.id}" are both at row ${plot.row}, col ${plot.col}`)
    }
    occupiedCells.set(cell, plot.id)
  }

  const plotSize = expectPositiveNumber(value.plotSize, `${path}.plotSize`)
  const gap = expectNumber(value.gap, `${path}.gap`)
  if (gap < 0) {
    fail(`${path}.gap`, "expected 0 or more")
  }

  return {
    id: expectString(value.id, `${path}.id`),
    name: expectString(value.name, `${path}.name`),
    x: expectNumber(value.x, `${path}.x`),
    y: expectNumber(value.y, `${path}.y`),
    rotation: optionalNumber(value.rotation, `${path}.rotation`),
    rows,
    cols,
    plotSize,
    plotLength:
      value.plotLength === undefined ? undefined : expectPositiveNumber(value.plotLength, `${path}.plotLength`),
    gap,
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

  return {
    id: expectString(value.id, `${path}.id`),
    row,
    col,
    status: expectOneOf(value.status, PLOT_STATUSES, `${path}.status`),
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

function isCurrencyCode(code: string): boolean {
  if (!/^[A-Z]{3}$/.test(code)) {
    return false
  }
  try {
    new Intl.NumberFormat("en", { style: "currency", currency: code })
    return true
  } catch {
    return false
  }
}

function fail(path: string, message: string): never {
  throw new LayoutValidationError({ path, message })
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

function optionalArray(value: unknown, path: string): unknown[] {
  return value === undefined ? [] : expectArray(value, path)
}

function expectNonEmptyArray(value: unknown, path: string): unknown[] {
  const array = expectArray(value, path)
  if (array.length === 0) {
    fail(path, "must contain at least one entry")
  }
  return array
}

function expectOneOf<T extends string>(value: unknown, options: readonly T[], path: string): T {
  const string = expectString(value, path)
  if (!(options as readonly string[]).includes(string)) {
    fail(path, `expected one of ${options.map((option) => `"${option}"`).join(", ")}, got "${string}"`)
  }
  return string as T
}

function optionalNumber(value: unknown, path: string): number | undefined {
  return value === undefined ? undefined : expectNumber(value, path)
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
