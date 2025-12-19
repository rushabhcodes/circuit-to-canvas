import type { PcbNotePath } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import type { PcbColorMap, CanvasContext } from "../types"
import { drawLine } from "../shapes/line"

export interface DrawPcbNotePathParams {
  ctx: CanvasContext
  path: PcbNotePath
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
}

export function drawPcbNotePath(params: DrawPcbNotePathParams): void {
  const { ctx, path, realToCanvasMat, colorMap } = params

  // Use the color from the path if provided, otherwise use a default color
  // Notes are typically shown in a distinct color
  const defaultColor = "rgb(89, 148, 220)" // Blue color for notes
  const color = path.color ?? defaultColor

  if (!path.route || path.route.length < 2) return

  // Draw each segment of the path
  for (let i = 0; i < path.route.length - 1; i++) {
    const start = path.route[i]
    const end = path.route[i + 1]

    if (!start || !end) continue

    drawLine({
      ctx,
      start: { x: start.x, y: start.y },
      end: { x: end.x, y: end.y },
      strokeWidth: path.stroke_width ?? 0.1,
      stroke: color,
      realToCanvasMat,
    })
  }
}
