#!/usr/bin/env node
/**
 * Generates the sample cemetery in src/data/layout.json.
 *
 * The sample is generated rather than hand-written so it stays internally
 * consistent (plot ids, rows and columns always match) and looks like a real
 * site: sections of different sizes and orientations, older sections mostly
 * occupied, the newest mostly open. It is seeded, so every run produces the
 * same file.
 *
 * You do not need this script to use your own cemetery: replace
 * src/data/layout.json with your own data in the same shape.
 *
 * Usage: node scripts/generate-sample-layout.mjs
 */

import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const OUTPUT = fileURLToPath(new URL("../src/data/layout.json", import.meta.url))

// Coordinates: 1 unit is roughly 10 cm. The site is about 140 m x 100 m.
const SITE = { name: "Sample Memorial Gardens", currency: "USD", width: 1400, height: 1000 }

const PLOT_WIDTH = 14
const PLOT_LENGTH = 26
const PLOT_GAP = 6

/**
 * Sections, oldest first. `fill` is the share of plots already used:
 * occupied plots cluster in the rows that were laid out first.
 */
const SECTIONS = [
  {
    id: "A",
    name: "Garden of Peace",
    x: 190, y: 175, rotation: 0, rows: 7, cols: 13,
    basePrice: 1400, occupied: 0.55, reserved: 0.1,
  },
  {
    id: "B",
    name: "Cedar Walk",
    x: 170, y: 505, rotation: -5, rows: 6, cols: 11,
    basePrice: 1150, occupied: 0.3, reserved: 0.15,
  },
  {
    id: "C",
    name: "Willow Rise",
    x: 830, y: 170, rotation: 4, rows: 6, cols: 10,
    basePrice: 1250, occupied: 0.1, reserved: 0.2,
  },
  {
    id: "D",
    name: "Meadow View",
    x: 800, y: 540, rotation: 0, rows: 5, cols: 15,
    basePrice: 950, occupied: 0.02, reserved: 0.12,
  },
]

const PACKAGES = [
  {
    id: "single",
    name: "Single plot",
    description: "One burial space with a standard headstone foundation.",
    priceMultiplier: 1,
  },
  {
    id: "companion",
    name: "Companion plot",
    description: "Two burial spaces side by side, reserved together.",
    priceMultiplier: 1.8,
  },
  {
    id: "vault",
    name: "Family vault",
    description: "A lined below-ground vault for up to four family members.",
    priceMultiplier: 4.5,
  },
]

const LANDMARKS = [
  { id: "main-gate", kind: "gate", label: "Main gate", x: 560, y: 952, width: 110, height: 28 },
  { id: "office", kind: "office", label: "Office", x: 720, y: 862, width: 100, height: 64 },
  { id: "parking", kind: "parking", label: "Parking", x: 330, y: 850, width: 190, height: 96 },
  { id: "chapel", kind: "chapel", label: "Chapel", x: 610, y: 70, width: 150, height: 104 },
]

const PATHS = [
  {
    id: "main-avenue",
    kind: "road",
    width: 46,
    points: [[615, 1000], [615, 820], [628, 640], [650, 460], [676, 300], [685, 200]],
  },
  { id: "parking-spur", kind: "road", width: 36, points: [[615, 900], [520, 900]] },
  {
    id: "west-walk",
    kind: "footpath",
    width: 14,
    points: [[648, 470], [480, 468], [150, 462], [120, 440], [118, 180], [150, 140], [610, 130]],
  },
  {
    id: "east-walk",
    kind: "footpath",
    width: 14,
    points: [[652, 470], [780, 480], [1180, 490], [1240, 470], [1250, 170], [1220, 135], [760, 125]],
  },
  { id: "meadow-walk", kind: "footpath", width: 12, points: [[630, 700], [780, 718], [1130, 720]] },
  { id: "south-walk", kind: "footpath", width: 12, points: [[630, 740], [470, 760], [160, 760]] },
]

// Deterministic PRNG (mulberry32) so the sample never changes between runs.
function createRandom(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const random = createRandom(20260927)
const between = (min, max) => min + random() * (max - min)
const round = (value) => Math.round(value * 10) / 10

function buildPlots(section) {
  const cells = []
  for (let row = 1; row <= section.rows; row++) {
    for (let col = 1; col <= section.cols; col++) {
      // Burials fill roughly row by row, with some irregularity.
      cells.push({ row, col, order: row + between(-1.2, 1.2) })
    }
  }

  const total = cells.length
  const occupiedCount = Math.round(total * section.occupied)
  const reservedCount = Math.round(total * section.reserved)

  const byFillOrder = [...cells].sort((a, b) => a.order - b.order)
  byFillOrder.slice(0, occupiedCount).forEach((cell) => (cell.status = "occupied"))

  // Reservations sit just beyond the occupied frontier, as families buy ahead.
  const open = byFillOrder.slice(occupiedCount)
  const frontier = open.slice(0, Math.min(open.length, reservedCount * 3))
  frontier
    .sort(() => random() - 0.5)
    .slice(0, reservedCount)
    .forEach((cell) => (cell.status = "reserved"))

  return cells.map((cell, index) => {
    // Front rows (nearest the path) carry a small premium.
    const rowPremium = 1 + (0.12 * (section.rows - cell.row)) / Math.max(section.rows - 1, 1)
    return {
      id: `${section.id}-${index + 1}`,
      row: cell.row,
      col: cell.col,
      status: cell.status ?? "available",
      basePrice: Math.round((section.basePrice * rowPremium) / 50) * 50,
    }
  })
}

function ellipse(cx, cy, rx, ry, steps, wobble) {
  return Array.from({ length: steps }, (_, i) => {
    const angle = (i / steps) * Math.PI * 2
    const jitter = 1 + between(-wobble, wobble)
    return [round(cx + Math.cos(angle) * rx * jitter), round(cy + Math.sin(angle) * ry * jitter)]
  })
}

const GROUNDS = [
  {
    id: "grounds",
    kind: "lawn",
    points: [[70, 60], [1330, 60], [1340, 960], [980, 975], [700, 990], [260, 975], [60, 950]],
  },
  { id: "chapel-forecourt", kind: "gravel", points: [[590, 170], [780, 170], [760, 225], [610, 225]] },
  { id: "gate-forecourt", kind: "gravel", points: [[540, 935], [690, 935], [700, 990], [530, 990]] },
  { id: "parking-surface", kind: "gravel", points: [[320, 842], [530, 842], [530, 954], [320, 954]] },
  // Drawn in order: the planting ring sits under the pond it surrounds.
  { id: "pond-planting", kind: "planting", points: ellipse(1150, 850, 130, 84, 20, 0.12) },
  { id: "pond", kind: "water", points: ellipse(1150, 850, 90, 52, 18, 0.08) },
  { id: "chapel-garden-west", kind: "planting", points: ellipse(515, 120, 60, 34, 14, 0.15) },
  { id: "chapel-garden-east", kind: "planting", points: ellipse(855, 110, 56, 30, 14, 0.15) },
  { id: "office-garden", kind: "planting", points: ellipse(870, 905, 46, 30, 12, 0.15) },
]

const POND = { cx: 1150, cy: 850, rx: 100, ry: 60 }
const BOUNDS = { minX: 56, minY: 44, maxX: 1350, maxY: 996 }

function sectionSize(section) {
  return {
    width: section.cols * PLOT_WIDTH + (section.cols - 1) * PLOT_GAP,
    height: section.rows * PLOT_LENGTH + (section.rows - 1) * PLOT_GAP,
  }
}

function insideSection(x, y, section, margin) {
  const angle = (-(section.rotation ?? 0) * Math.PI) / 180
  const dx = x - section.x
  const dy = y - section.y
  const localX = dx * Math.cos(angle) - dy * Math.sin(angle)
  const localY = dx * Math.sin(angle) + dy * Math.cos(angle)
  const { width, height } = sectionSize(section)
  return localX > -margin && localX < width + margin && localY > -margin && localY < height + margin
}

function distanceToSegment(x, y, [ax, ay], [bx, by]) {
  const lengthSquared = (bx - ax) ** 2 + (by - ay) ** 2
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / lengthSquared))
  return Math.hypot(x - (ax + t * (bx - ax)), y - (ay + t * (by - ay)))
}

/** A tree may not stand on a grave, a path, a building, the pond or outside the grounds. */
function isClearForTree(x, y, radius) {
  if (x - radius < BOUNDS.minX - 8 || x + radius > BOUNDS.maxX + 8) return false
  if (y - radius < BOUNDS.minY - 8 || y + radius > BOUNDS.maxY + 8) return false
  if (SECTIONS.some((section) => insideSection(x, y, section, radius + 18))) return false
  if (((x - POND.cx) / (POND.rx + radius)) ** 2 + ((y - POND.cy) / (POND.ry + radius)) ** 2 < 1) return false
  for (const path of PATHS) {
    for (let i = 1; i < path.points.length; i++) {
      if (distanceToSegment(x, y, path.points[i - 1], path.points[i]) < path.width / 2 + radius * 0.7) return false
    }
  }
  return !LANDMARKS.some(
    (landmark) =>
      x > landmark.x - radius - 10 &&
      x < landmark.x + landmark.width + radius + 10 &&
      y > landmark.y - radius - 10 &&
      y < landmark.y + landmark.height + radius + 10,
  )
}

function buildTrees() {
  const trees = []
  const crowded = (x, y, radius) =>
    trees.some((tree) => Math.hypot(tree.x - x, tree.y - y) < (tree.radius + radius) * 0.75)
  const add = (x, y, radius) => {
    if (isClearForTree(x, y, radius) && !crowded(x, y, radius)) {
      trees.push({ x: round(x), y: round(y), radius: round(radius) })
    }
  }

  // Boundary planting, leaving the gate open.
  for (let x = 95; x <= 1310; x += between(52, 72)) {
    add(x, between(70, 92), between(16, 24))
    if (x < 510 || x > 720) add(x, between(955, 975), between(15, 22))
  }
  for (let y = 130; y <= 900; y += between(56, 76)) {
    add(between(76, 96), y, between(16, 24))
    add(between(1310, 1330), y, between(16, 24))
  }

  // Avenue trees either side of the main road.
  for (let t = 0; t <= 1; t += 0.14) {
    const y = 820 - t * 560
    const x = 615 + t * 60
    add(x - 48, y, between(14, 18))
    add(x + 48, y, between(14, 18))
  }

  // Clusters: around the pond, the chapel and an open meadow corner.
  const clusters = [
    [1150, 850, 150, 7],
    [690, 100, 130, 4],
    [1150, 330, 70, 5],
    [300, 690, 60, 3],
  ]
  for (const [cx, cy, spread, count] of clusters) {
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2
      const distance = spread * (0.75 + random() * 0.35)
      add(cx + Math.cos(angle) * distance, cy + Math.sin(angle) * distance * 0.7, between(18, 28))
    }
  }

  return trees
}

const layout = {
  site: SITE,
  grounds: GROUNDS,
  trees: buildTrees(),
  landmarks: LANDMARKS,
  paths: PATHS,
  sections: SECTIONS.map(({ basePrice, occupied, reserved, ...section }) => ({
    ...section,
    plotSize: PLOT_WIDTH,
    plotLength: PLOT_LENGTH,
    gap: PLOT_GAP,
    plots: buildPlots({ ...section, basePrice, occupied, reserved }),
  })),
  packages: PACKAGES,
}

writeFileSync(OUTPUT, `${JSON.stringify(layout, null, 2)}\n`)

const plots = layout.sections.flatMap((section) => section.plots)
const count = (status) => plots.filter((plot) => plot.status === status).length
const share = (status) => `${Math.round((count(status) / plots.length) * 100)}%`
console.log(
  `Wrote ${plots.length} plots: ${share("available")} available, ${share("reserved")} reserved, ${share("occupied")} occupied`,
)
