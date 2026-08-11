import type { PcbCopperPour } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import { applyToPoint } from "transformation-matrix"
import { addBrepShapeToPath } from "../shapes/brep"
import type { CanvasContext, PcbColorMap } from "../types"

export interface DrawPcbCopperPourParams {
  ctx: CanvasContext
  pour: PcbCopperPour
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
}

function layerToColor(layer: string, colorMap: PcbColorMap): string {
  return (
    colorMap.copper[layer as keyof typeof colorMap.copper] ??
    colorMap.copper.top
  )
}

/**
 * Appends a copper pour's exact geometry to the current canvas path without
 * beginning, filling, or clipping it. This keeps pour painting and trace
 * clipping on the same geometry implementation.
 */
export function appendPcbCopperPourPath(params: {
  ctx: CanvasContext
  pour: PcbCopperPour
  realToCanvasMat: Matrix
}): void {
  const { ctx, pour, realToCanvasMat } = params

  if (pour.shape === "rect") {
    const halfWidth = pour.width / 2
    const halfHeight = pour.height / 2
    const rotation = ((pour.rotation ?? 0) * Math.PI) / 180
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)
    const canvasPoints = [
      { x: -halfWidth, y: -halfHeight },
      { x: halfWidth, y: -halfHeight },
      { x: halfWidth, y: halfHeight },
      { x: -halfWidth, y: halfHeight },
    ].map((point) =>
      applyToPoint(realToCanvasMat, [
        pour.center.x + point.x * cos - point.y * sin,
        pour.center.y + point.x * sin + point.y * cos,
      ]),
    )
    const firstPoint = canvasPoints[0]
    if (!firstPoint) return

    ctx.moveTo(firstPoint[0], firstPoint[1])
    for (let index = 1; index < canvasPoints.length; index++) {
      const point = canvasPoints[index]
      if (point) ctx.lineTo(point[0], point[1])
    }
    ctx.closePath()
    return
  }

  if (pour.shape === "polygon") {
    const firstPoint = pour.points[0]
    if (!firstPoint) return
    const [firstX, firstY] = applyToPoint(realToCanvasMat, [
      firstPoint.x,
      firstPoint.y,
    ])
    ctx.moveTo(firstX, firstY)

    for (let index = 1; index < pour.points.length; index++) {
      const point = pour.points[index]
      if (!point) continue
      const [x, y] = applyToPoint(realToCanvasMat, [point.x, point.y])
      ctx.lineTo(x, y)
    }
    ctx.closePath()
    return
  }

  if (pour.shape !== "brep") return

  addBrepShapeToPath({ ctx, shape: pour.brep_shape, realToCanvasMat })
}

export function drawPcbCopperPour(params: DrawPcbCopperPourParams): void {
  const { ctx, pour, realToCanvasMat, colorMap } = params

  const color = layerToColor(pour.layer, colorMap)
  const opacity = 0.5

  // Save context to apply opacity
  ctx.save()
  ctx.globalAlpha = opacity

  ctx.beginPath()
  appendPcbCopperPourPath({ ctx, pour, realToCanvasMat })
  ctx.fillStyle = color
  ctx.fill(pour.shape === "brep" ? "evenodd" : "nonzero")
  ctx.restore()
}
