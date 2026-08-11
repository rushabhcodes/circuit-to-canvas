import type { LayerRef, PcbPlatedHole, PcbTrace, PcbVia } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import { drawLine } from "../../shapes/line"
import { drawPolygon } from "../../shapes/polygon"
import type { CanvasContext, PcbColorMap } from "../../types"
import { buildTracePolygon } from "./build-trace-polygon"
import { collectTraceSegments } from "./collect-trace-segments"
import { cutTraceDestinationsAtDrills } from "./cut-trace-destination-drills"
import { layerToColor } from "./layer-to-color"

export interface DrawPcbTraceParams {
  ctx: CanvasContext
  trace: PcbTrace
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
  vias?: PcbVia[]
  platedHoles?: PcbPlatedHole[]
  layer?: LayerRef
}

// Draws a PCB trace route as lines or a filled polygon when widths vary.
export function drawPcbTrace(params: DrawPcbTraceParams): void {
  const { ctx, trace, realToCanvasMat, colorMap, layer: layerFilter } = params

  if (!trace.route || !Array.isArray(trace.route) || trace.route.length < 2) {
    return
  }

  const segments = collectTraceSegments(trace.route)

  for (const segment of segments) {
    const layer = segment[0]?.layer
    if (!layer) continue
    if (layerFilter && layer !== layerFilter) continue
    const color = layerToColor(layer, colorMap)

    if (trace.route_thickness_mode === "interpolated") {
      drawPolygon({
        ctx,
        points: buildTracePolygon(segment),
        fill: color,
        realToCanvasMat,
      })
      continue
    }

    // Constant or unspecified modes use each segment width independently.
    // Round caps overlap at route points without introducing polygon miters.
    for (let i = 0; i < segment.length - 1; i++) {
      const start = segment[i]
      const end = segment[i + 1]
      if (!start || !end) continue
      if (start.is_inside_copper_pour && end.is_inside_copper_pour) {
        continue
      }

      drawLine({
        ctx,
        start: { x: start.x, y: start.y },
        end: { x: end.x, y: end.y },
        strokeWidth: start.width,
        stroke: color,
        realToCanvasMat,
        lineCap: "round",
      })
    }
  }

  cutTraceDestinationsAtDrills({
    ctx,
    trace,
    realToCanvasMat,
    vias: params.vias ?? [],
    platedHoles: params.platedHoles ?? [],
    layer: layerFilter,
  })
}
