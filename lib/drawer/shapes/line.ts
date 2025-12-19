import type { Matrix } from "transformation-matrix"
import { applyToPoint } from "transformation-matrix"
import type { CanvasContext } from "../types"

export interface DrawLineParams {
  ctx: CanvasContext
  start: { x: number; y: number }
  end: { x: number; y: number }
  strokeWidth: number
  stroke: string
  realToCanvasMat: Matrix
  lineCap?: "butt" | "round" | "square"
}

export function drawLine(params: DrawLineParams): void {
  const {
    ctx,
    start,
    end,
    strokeWidth,
    stroke,
    realToCanvasMat,
    lineCap = "round",
  } = params

  const [x1, y1] = applyToPoint(realToCanvasMat, [start.x, start.y])
  const [x2, y2] = applyToPoint(realToCanvasMat, [end.x, end.y])
  const scaledStrokeWidth = strokeWidth * Math.abs(realToCanvasMat.a)

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.lineWidth = scaledStrokeWidth
  ctx.strokeStyle = stroke
  ctx.lineCap = lineCap
  ctx.stroke()
}
