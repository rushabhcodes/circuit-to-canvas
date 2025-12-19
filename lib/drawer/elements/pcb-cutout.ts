import type { PcbCutout } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import type { PcbColorMap, CanvasContext } from "../types"
import { drawRect } from "../shapes/rect"
import { drawCircle } from "../shapes/circle"
import { drawPolygon } from "../shapes/polygon"

export interface DrawPcbCutoutParams {
  ctx: CanvasContext
  cutout: PcbCutout
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
}

export function drawPcbCutout(params: DrawPcbCutoutParams): void {
  const { ctx, cutout, realToCanvasMat, colorMap } = params

  if (cutout.shape === "rect") {
    drawRect({
      ctx,
      center: cutout.center,
      width: cutout.width,
      height: cutout.height,
      fill: colorMap.drill,
      realToCanvasMat,
      rotation: cutout.rotation ?? 0,
    })
    return
  }

  if (cutout.shape === "circle") {
    drawCircle({
      ctx,
      center: cutout.center,
      radius: cutout.radius,
      fill: colorMap.drill,
      realToCanvasMat,
    })
    return
  }

  if (cutout.shape === "polygon") {
    if (cutout.points && cutout.points.length >= 3) {
      drawPolygon({
        ctx,
        points: cutout.points,
        fill: colorMap.drill,
        realToCanvasMat,
      })
    }
    return
  }
}
