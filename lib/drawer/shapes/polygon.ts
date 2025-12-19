import type { Matrix } from "transformation-matrix"
import { applyToPoint } from "transformation-matrix"
import type { CanvasContext } from "../types"

export interface DrawPolygonParams {
  ctx: CanvasContext
  points: Array<{ x: number; y: number }>
  fill: string
  realToCanvasMat: Matrix
}

export function drawPolygon(params: DrawPolygonParams): void {
  const { ctx, points, fill, realToCanvasMat } = params

  if (points.length < 3) return

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

  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}
