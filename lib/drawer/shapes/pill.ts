import type { Matrix } from "transformation-matrix"
import { applyToPoint } from "transformation-matrix"
import type { CanvasContext } from "../types"

export interface DrawPillParams {
  ctx: CanvasContext
  center: { x: number; y: number }
  width: number
  height: number
  fill: string
  realToCanvasMat: Matrix
  rotation?: number
}

export function drawPill(params: DrawPillParams): void {
  const {
    ctx,
    center,
    width,
    height,
    fill,
    realToCanvasMat,
    rotation = 0,
  } = params

  const [cx, cy] = applyToPoint(realToCanvasMat, [center.x, center.y])
  const scaledWidth = width * Math.abs(realToCanvasMat.a)
  const scaledHeight = height * Math.abs(realToCanvasMat.a)

  ctx.save()
  ctx.translate(cx, cy)

  if (rotation !== 0) {
    ctx.rotate(-rotation * (Math.PI / 180))
  }

  ctx.beginPath()

  if (scaledWidth > scaledHeight) {
    // Horizontal pill
    const radius = scaledHeight / 2
    const straightLength = scaledWidth - scaledHeight

    ctx.moveTo(-straightLength / 2, -radius)
    ctx.lineTo(straightLength / 2, -radius)
    ctx.arc(straightLength / 2, 0, radius, -Math.PI / 2, Math.PI / 2)
    ctx.lineTo(-straightLength / 2, radius)
    ctx.arc(-straightLength / 2, 0, radius, Math.PI / 2, -Math.PI / 2)
  } else if (scaledHeight > scaledWidth) {
    // Vertical pill
    const radius = scaledWidth / 2
    const straightLength = scaledHeight - scaledWidth

    ctx.moveTo(radius, -straightLength / 2)
    ctx.lineTo(radius, straightLength / 2)
    ctx.arc(0, straightLength / 2, radius, 0, Math.PI)
    ctx.lineTo(-radius, -straightLength / 2)
    ctx.arc(0, -straightLength / 2, radius, Math.PI, 0)
  } else {
    // Circle (width === height)
    ctx.arc(0, 0, scaledWidth / 2, 0, Math.PI * 2)
  }

  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  ctx.restore()
}
