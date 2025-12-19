import type { PcbNoteLine } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import { applyToPoint } from "transformation-matrix"
import type { PcbColorMap, CanvasContext } from "../types"

export interface DrawPcbNoteLineParams {
  ctx: CanvasContext
  line: PcbNoteLine
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
}

export function drawPcbNoteLine(params: DrawPcbNoteLineParams): void {
  const { ctx, line, realToCanvasMat, colorMap } = params

  // Use the color from the line if provided, otherwise use a default color
  // Notes are typically shown in a distinct color
  const defaultColor = "rgb(89, 148, 220)" // Blue color for notes
  const color = line.color ?? defaultColor

  const strokeWidth = line.stroke_width ?? 0.1
  const isDashed = line.is_dashed ?? false

  const [x1, y1] = applyToPoint(realToCanvasMat, [line.x1, line.y1])
  const [x2, y2] = applyToPoint(realToCanvasMat, [line.x2, line.y2])
  const scaledStrokeWidth = strokeWidth * Math.abs(realToCanvasMat.a)

  ctx.save()

  // Set up dashed line if needed
  if (isDashed) {
    ctx.setLineDash([scaledStrokeWidth * 2, scaledStrokeWidth * 2])
  } else {
    ctx.setLineDash([])
  }

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.lineWidth = scaledStrokeWidth
  ctx.strokeStyle = color
  ctx.lineCap = "round"
  ctx.stroke()

  ctx.restore()
}
