import type { PcbDebugObject } from "circuit-json"
import { applyToPoint, type Matrix } from "transformation-matrix"
import type { CanvasContext } from "../types"
import { drawText } from "../shapes/text"

const DEBUG_COLOR = "#ff4d4d"
const IDENTITY_MATRIX: Matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }

interface PcbDebugObjectStyle {
  fontSize: number
  strokeWidth: number
  dashLength: number
  labelGap: number
  pointRadius: number
}

export interface DrawPcbDebugObjectParams {
  ctx: CanvasContext
  debugObject: PcbDebugObject
  realToCanvasMat: Matrix
  labelStackIndex?: number
}

function getDebugObjectStyle(ctx: CanvasContext): PcbDebugObjectStyle {
  const viewportScale = Math.min(ctx.canvas.width, ctx.canvas.height)
  const strokeWidth = Math.max(1, Math.min(2, viewportScale * 0.002))
  const fontSize = Math.max(10, Math.min(18, viewportScale * 0.02))

  return {
    fontSize,
    strokeWidth,
    dashLength: strokeWidth * 4,
    labelGap: fontSize * 0.35,
    pointRadius: strokeWidth * 3,
  }
}

function drawLabel({
  ctx,
  label,
  x,
  y,
  style,
  align = "left",
}: {
  ctx: CanvasContext
  label?: string
  x: number
  y: number
  style: PcbDebugObjectStyle
  align?: "left" | "center"
}): void {
  if (!label) return

  ctx.setLineDash([])
  drawText({
    ctx,
    text: label,
    x,
    y,
    fontSize: style.fontSize,
    color: DEBUG_COLOR,
    realToCanvasMat: IDENTITY_MATRIX,
    anchorAlignment: align === "center" ? "bottom_center" : "bottom_left",
  })
}

export function drawPcbDebugObject({
  ctx,
  debugObject,
  realToCanvasMat,
  labelStackIndex = 0,
}: DrawPcbDebugObjectParams): void {
  const style = getDebugObjectStyle(ctx)

  ctx.save()
  ctx.strokeStyle = DEBUG_COLOR
  ctx.lineWidth = style.strokeWidth
  ctx.setLineDash([style.dashLength, style.dashLength])

  if (debugObject.shape === "rect") {
    const firstCorner = applyToPoint(realToCanvasMat, [
      debugObject.center.x - debugObject.size.width / 2,
      debugObject.center.y - debugObject.size.height / 2,
    ])
    const secondCorner = applyToPoint(realToCanvasMat, [
      debugObject.center.x + debugObject.size.width / 2,
      debugObject.center.y + debugObject.size.height / 2,
    ])
    const left = Math.min(firstCorner[0], secondCorner[0])
    const top = Math.min(firstCorner[1], secondCorner[1])
    const width = Math.abs(secondCorner[0] - firstCorner[0])
    const height = Math.abs(secondCorner[1] - firstCorner[1])

    ctx.beginPath()
    ctx.rect(left, top, width, height)
    ctx.stroke()
    drawLabel({
      ctx,
      label: debugObject.label,
      x: left,
      y:
        top -
        style.labelGap -
        labelStackIndex * (style.fontSize + style.labelGap),
      style,
    })
    ctx.restore()
    return
  }

  if (debugObject.shape === "line") {
    const [startX, startY] = applyToPoint(realToCanvasMat, [
      debugObject.start.x,
      debugObject.start.y,
    ])
    const [endX, endY] = applyToPoint(realToCanvasMat, [
      debugObject.end.x,
      debugObject.end.y,
    ])

    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
    drawLabel({
      ctx,
      label: debugObject.label,
      x: (startX + endX) / 2,
      y: (startY + endY) / 2 - style.labelGap,
      style,
      align: "center",
    })
    ctx.restore()
    return
  }

  const [centerX, centerY] = applyToPoint(realToCanvasMat, [
    debugObject.center.x,
    debugObject.center.y,
  ])
  ctx.beginPath()
  ctx.arc(centerX, centerY, style.pointRadius, 0, Math.PI * 2)
  ctx.stroke()
  drawLabel({
    ctx,
    label: debugObject.label,
    x: centerX + style.pointRadius + style.labelGap,
    y: centerY - style.pointRadius,
    style,
  })
  ctx.restore()
}
