/**
 * The cemetery layout schema. `src/data/layout.json` must match this shape;
 * it is checked at load time by `validateLayout` in `src/lib/layout.ts`.
 *
 * Coordinates are in one site-wide space (`site.width` x `site.height`), origin at
 * the top-left, y pointing down. Units are arbitrary but must be consistent; the
 * sample uses roughly 1 unit = 10 cm.
 *
 * Arrays marked optional may be omitted from the JSON and default to empty. Grid
 * view needs only `site`, `sections` and `packages`; the site map view also uses
 * the spatial fields.
 */

export type PlotStatus = "available" | "reserved" | "occupied"

export type GroundKind = "lawn" | "gravel" | "water" | "planting"
export type LandmarkKind = "gate" | "chapel" | "office" | "parking" | "other"
export type PathKind = "road" | "footpath"

export type Point = [number, number]

export interface Site {
  /** Display name, e.g. "Sample Memorial Gardens". */
  name: string
  /** ISO 4217 currency code, e.g. "USD". */
  currency: string
  width: number
  height: number
}

/** A real aerial photo or survey drawing placed under the site map. */
export interface Underlay {
  /** Path under /public, e.g. "/site/aerial.jpg". */
  src: string
  x: number
  y: number
  width: number
  height: number
  /** 0 to 1. Defaults to 1. */
  opacity?: number
}

/** A closed area of ground: lawn, gravel, water or planting. */
export interface Ground {
  id: string
  kind: GroundKind
  points: Point[]
}

export interface Tree {
  x: number
  y: number
  /** Canopy radius. */
  radius: number
}

export interface Landmark {
  id: string
  kind: LandmarkKind
  /** "Main gate", "Chapel", "Office". */
  label: string
  x: number
  y: number
  width: number
  height: number
  /** Degrees clockwise around the landmark's centre. Defaults to 0. */
  rotation?: number
}

export interface Path {
  id: string
  kind: PathKind
  width: number
  points: Point[]
}

export interface Plot {
  /** Unique across the whole layout, e.g. "A-12". */
  id: string
  /** 1-based. */
  row: number
  /** 1-based. */
  col: number
  status: PlotStatus
  basePrice: number
}

export interface Section {
  /** Short code, e.g. "A". */
  id: string
  /** e.g. "Garden of Peace". */
  name: string
  /** Top-left corner of the section on the site. */
  x: number
  y: number
  /** Degrees clockwise around the section's top-left corner. Defaults to 0. */
  rotation?: number
  rows: number
  cols: number
  /** Plot width, across a row. */
  plotSize: number
  /** Plot length, along a column. Defaults to `plotSize` (square plots). */
  plotLength?: number
  /** Space between neighbouring plots. */
  gap: number
  plots: Plot[]
}

export interface Package {
  id: string
  /** "Single plot", "Companion plot", "Family vault". */
  name: string
  description: string
  /** Applied to the plot's `basePrice`. */
  priceMultiplier: number
}

/** A validated layout. Optional arrays in the JSON are always present here. */
export interface Layout {
  site: Site
  underlay?: Underlay
  grounds: Ground[]
  trees: Tree[]
  landmarks: Landmark[]
  paths: Path[]
  sections: Section[]
  packages: Package[]
}
