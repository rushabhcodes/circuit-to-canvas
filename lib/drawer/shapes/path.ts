import type { Matrix } from "transformation-matrix"
import { applyToPoint } from "transformation-matrix"
import type { CanvasContext } from "../types"

export interface DrawPathParams {
  ctx: CanvasContext
  points: Array<{ x: number; y: number }>
  fill?: string
  stroke?: string
  strokeWidth?: number
  realToCanvasMat: Matrix
  closePath?: boolean
}

export function drawPath(params: DrawPathParams): void {
  const {
    ctx,
    points,
    fill,
    stroke,
    strokeWidth = 1,
    realToCanvasMat,
    closePath = false,
  } = params

  if (points.length < 2) return

  ctx.beginPath()

  const canvasPoints = points.map((p) =>
    applyToPoint(realToCanvasMat, [p.x, p.y]),
  )

  const firstPoint = canvasPoints[0]
  if (!firstPoint) return
  const [firstX, firstY] = firstPoint
  ctx.moveTo(firstX, firstY)

  for (let i = 1; i < canvasPoints.length; i++) {
    const point = canvasPoints[i]
    if (!point) continue
    const [x, y] = point
    ctx.lineTo(x, y)
  }

  if (closePath) {
    ctx.closePath()
  }

  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }

  if (stroke) {
    const scaledStrokeWidth = strokeWidth * Math.abs(realToCanvasMat.a)
    ctx.strokeStyle = stroke
    ctx.lineWidth = scaledStrokeWidth
    ctx.stroke()
  }
}
