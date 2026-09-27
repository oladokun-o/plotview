export type PlotStatus = "available" | "reserved" | "occupied"

export interface Landmark {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
}

export interface Path {
  id: string
  points: [number, number][]
}

export interface Plot {
  id: string
  row: number
  col: number
  status: PlotStatus
  basePrice: number
}

export interface Section {
  id: string
  name: string
  x: number
  y: number
  rows: number
  cols: number
  plotSize: number
  gap: number
  plots: Plot[]
}

export interface Package {
  id: string
  name: string
  description: string
  priceMultiplier: number
}

export interface Layout {
  site: {
    name: string
    currency: string
    width: number
    height: number
  }
  landmarks: Landmark[]
  paths: Path[]
  sections: Section[]
  packages: Package[]
}
