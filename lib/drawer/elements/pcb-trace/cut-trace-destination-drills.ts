import type { LayerRef, PcbPlatedHole, PcbTrace, PcbVia } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import { drawCircle } from "../../shapes/circle"
import { drawOval } from "../../shapes/oval"
import { drawPill } from "../../shapes/pill"
import type { CanvasContext } from "../../types"
import { collectTraceSegments } from "./collect-trace-segments"

const COORD_EPSILON = 1e-6

interface TraceDrillCutoutCircle {
  shape: "circle"
  x: number
  y: number
  radius: number
}

interface TraceDrillCutoutOval {
  shape: "oval"
  x: number
  y: number
  radiusX: number
  radiusY: number
  rotation?: number
}

interface TraceDrillCutoutPill {
  shape: "pill"
  x: number
  y: number
  width: number
  height: number
  rotation?: number
}

type TraceDrillCutout =
  | TraceDrillCutoutCircle
  | TraceDrillCutoutOval
  | TraceDrillCutoutPill

export function cutTraceDestinationsAtDrills(params: {
  ctx: CanvasContext
  trace: PcbTrace
  realToCanvasMat: Matrix
  vias: PcbVia[]
  platedHoles: PcbPlatedHole[]
  layer?: LayerRef
}): void {
  const { ctx, trace, realToCanvasMat, vias, platedHoles, layer } = params
  if (!trace.route || trace.route.length < 2) return

  const segments = collectTraceSegments(trace.route)
  if (segments.length === 0) return

  const cutouts = new Map<string, TraceDrillCutout>()

  for (const segment of segments) {
    const segmentLayer = segment[0]?.layer
    const destination = segment[segment.length - 1]
    if (!segmentLayer || !destination) continue
    if (layer && segmentLayer !== layer) continue

    for (const via of vias) {
      if (
        via.layers &&
        Array.isArray(via.layers) &&
        !via.layers.includes(segmentLayer)
      ) {
        continue
      }
      if (!isSamePoint(destination.x, destination.y, via.x, via.y)) continue

      const radius = via.hole_diameter / 2
      if (radius <= 0) continue

      const cutout: TraceDrillCutoutCircle = {
        shape: "circle",
        x: via.x,
        y: via.y,
        radius,
      }
      cutouts.set(getCutoutKey(cutout), cutout)
    }

    for (const platedHole of platedHoles) {
      if (
        platedHole.layers &&
        Array.isArray(platedHole.layers) &&
        !platedHole.layers.includes(segmentLayer)
      ) {
        continue
      }

      const cutout = getPlatedHoleDrillCutout(platedHole)
      if (!cutout) continue
      if (!isSamePoint(destination.x, destination.y, cutout.x, cutout.y))
        continue

      cutouts.set(getCutoutKey(cutout), cutout)
    }
  }

  if (cutouts.size === 0) return

  ctx.save()
  ctx.globalCompositeOperation = "destination-out"

  for (const cutout of cutouts.values()) {
    if (cutout.shape === "circle") {
      drawCircle({
        ctx,
        center: { x: cutout.x, y: cutout.y },
        radius: cutout.radius,
        fill: "#000",
        realToCanvasMat,
      })
      continue
    }

    if (cutout.shape === "oval") {
      drawOval({
        ctx,
        center: { x: cutout.x, y: cutout.y },
        radius_x: cutout.radiusX,
        radius_y: cutout.radiusY,
        fill: "#000",
        realToCanvasMat,
        rotation: cutout.rotation,
      })
      continue
    }

    drawPill({
      ctx,
      center: { x: cutout.x, y: cutout.y },
      width: cutout.width,
      height: cutout.height,
      fill: "#000",
      realToCanvasMat,
      rotation: cutout.rotation,
    })
  }

  ctx.restore()
}

function getPlatedHoleDrillCutout(
  hole: PcbPlatedHole,
): TraceDrillCutout | undefined {
  if (hole.shape === "circle") {
    const radius = hole.hole_diameter / 2
    if (radius <= 0) return
    return {
      shape: "circle",
      x: hole.x,
      y: hole.y,
      radius,
    }
  }

  if (hole.shape === "oval") {
    const radiusX = hole.hole_width / 2
    const radiusY = hole.hole_height / 2
    if (radiusX <= 0 || radiusY <= 0) return
    return {
      shape: "oval",
      x: hole.x,
      y: hole.y,
      radiusX,
      radiusY,
      rotation: hole.ccw_rotation,
    }
  }

  if (hole.shape === "pill") {
    if (hole.hole_width <= 0 || hole.hole_height <= 0) return
    return {
      shape: "pill",
      x: hole.x,
      y: hole.y,
      width: hole.hole_width,
      height: hole.hole_height,
      rotation: hole.ccw_rotation,
    }
  }

  if (hole.shape === "circular_hole_with_rect_pad") {
    const radius = hole.hole_diameter / 2
    if (radius <= 0) return
    return {
      shape: "circle",
      x: hole.x + (hole.hole_offset_x ?? 0),
      y: hole.y + (hole.hole_offset_y ?? 0),
      radius,
    }
  }

  if (hole.shape === "pill_hole_with_rect_pad") {
    if (hole.hole_width <= 0 || hole.hole_height <= 0) return
    return {
      shape: "pill",
      x: hole.x + (hole.hole_offset_x ?? 0),
      y: hole.y + (hole.hole_offset_y ?? 0),
      width: hole.hole_width,
      height: hole.hole_height,
    }
  }

  if (hole.shape === "rotated_pill_hole_with_rect_pad") {
    if (hole.hole_width <= 0 || hole.hole_height <= 0) return
    return {
      shape: "pill",
      x: hole.x + (hole.hole_offset_x ?? 0),
      y: hole.y + (hole.hole_offset_y ?? 0),
      width: hole.hole_width,
      height: hole.hole_height,
      rotation: hole.hole_ccw_rotation,
    }
  }

  if (hole.shape !== "hole_with_polygon_pad") return

  const holeX = hole.x + (hole.hole_offset_x ?? 0)
  const holeY = hole.y + (hole.hole_offset_y ?? 0)
  const holeShape = hole.hole_shape

  if (holeShape === "circle") {
    const radius = (hole.hole_diameter ?? 0) / 2
    if (radius <= 0) return
    return {
      shape: "circle",
      x: holeX,
      y: holeY,
      radius,
    }
  }

  if (holeShape === "oval") {
    const radiusX = (hole.hole_width ?? 0) / 2
    const radiusY = (hole.hole_height ?? 0) / 2
    if (radiusX <= 0 || radiusY <= 0) return
    return {
      shape: "oval",
      x: holeX,
      y: holeY,
      radiusX,
      radiusY,
    }
  }

  if (holeShape === "pill" || holeShape === "rotated_pill") {
    const width = hole.hole_width ?? 0
    const height = hole.hole_height ?? 0
    if (width <= 0 || height <= 0) return
    return {
      shape: "pill",
      x: holeX,
      y: holeY,
      width,
      height,
      rotation: holeShape === "rotated_pill" ? hole.ccw_rotation : 0,
    }
  }
}

function isSamePoint(x1: number, y1: number, x2: number, y2: number): boolean {
  return (
    Math.abs(x1 - x2) <= COORD_EPSILON && Math.abs(y1 - y2) <= COORD_EPSILON
  )
}

function getCutoutKey(cutout: TraceDrillCutout): string {
  if (cutout.shape === "circle") {
    return `circle:${cutout.x}:${cutout.y}:${cutout.radius}`
  }
  if (cutout.shape === "oval") {
    return `oval:${cutout.x}:${cutout.y}:${cutout.radiusX}:${cutout.radiusY}:${cutout.rotation ?? 0}`
  }
  return `pill:${cutout.x}:${cutout.y}:${cutout.width}:${cutout.height}:${cutout.rotation ?? 0}`
}
