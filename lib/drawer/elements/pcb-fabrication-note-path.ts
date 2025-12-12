import type { PcbFabricationNotePath } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import type { PcbColorMap, CanvasContext } from "../types"
import { drawLine } from "../shapes/line"

export interface DrawPcbFabricationNotePathParams {
  ctx: CanvasContext
  path: PcbFabricationNotePath
  transform: Matrix
  colorMap: PcbColorMap
}

export function drawPcbFabricationNotePath(
  params: DrawPcbFabricationNotePathParams,
): void {
  const { ctx, path, transform, colorMap } = params

  // Use the color from the path if provided, otherwise use a default color
  // Fabrication notes are typically shown in a distinct color
  const defaultColor = "rgba(255,255,255,0.5)" // White color for fabrication notes
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
      transform,
    })
  }
}
