import type { PCBVia } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import type { PcbColorMap, CanvasContext } from "../types"
import { drawCircle } from "../shapes/circle"

export interface DrawPcbViaParams {
  ctx: CanvasContext
  via: PCBVia
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
}

export function drawPcbVia(params: DrawPcbViaParams): void {
  const { ctx, via, realToCanvasMat, colorMap } = params

  // Draw outer copper ring
  drawCircle({
    ctx,
    center: { x: via.x, y: via.y },
    radius: via.outer_diameter / 2,
    fill: colorMap.copper.top,
    realToCanvasMat,
  })

  // Draw inner drill hole
  drawCircle({
    ctx,
    center: { x: via.x, y: via.y },
    radius: via.hole_diameter / 2,
    fill: colorMap.drill,
    realToCanvasMat,
  })
}
