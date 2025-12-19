import type { PCBTrace } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import type { PcbColorMap, CanvasContext } from "../types"
import { drawLine } from "../shapes/line"

export interface DrawPcbTraceParams {
  ctx: CanvasContext
  trace: PCBTrace
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
}

function layerToColor(layer: string, colorMap: PcbColorMap): string {
  return (
    colorMap.copper[layer as keyof typeof colorMap.copper] ??
    colorMap.copper.top
  )
}

export function drawPcbTrace(params: DrawPcbTraceParams): void {
  const { ctx, trace, realToCanvasMat, colorMap } = params

  if (!trace.route || !Array.isArray(trace.route) || trace.route.length < 2) {
    return
  }

  // Draw each segment of the trace
  for (let i = 0; i < trace.route.length - 1; i++) {
    const start = trace.route[i]
    const end = trace.route[i + 1]

    if (!start || !end) continue

    // Get the layer from either point
    const layer =
      "layer" in start
        ? start.layer
        : "layer" in end
          ? (end as any).layer
          : null
    if (!layer) continue

    const color = layerToColor(layer, colorMap)

    // Get the trace width from either point
    const traceWidth =
      "width" in start ? start.width : "width" in end ? (end as any).width : 0.1

    drawLine({
      ctx,
      start: { x: start.x, y: start.y },
      end: { x: end.x, y: end.y },
      strokeWidth: traceWidth,
      stroke: color,
      realToCanvasMat,
      lineCap: "round",
    })
  }
}
