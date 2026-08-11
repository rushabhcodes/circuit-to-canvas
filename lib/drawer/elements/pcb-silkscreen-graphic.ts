import type { PcbSilkscreenGraphic } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import { addBrepShapeToPath } from "../shapes/brep"
import type { CanvasContext, PcbColorMap } from "../types"

export interface DrawPcbSilkscreenGraphicParams {
  ctx: CanvasContext
  graphic: PcbSilkscreenGraphic
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
}

export function drawPcbSilkscreenGraphic(
  params: DrawPcbSilkscreenGraphicParams,
): void {
  const { ctx, graphic, realToCanvasMat, colorMap } = params
  const color =
    graphic.layer === "bottom"
      ? colorMap.silkscreen.bottom
      : colorMap.silkscreen.top

  ctx.beginPath()
  addBrepShapeToPath({ ctx, shape: graphic.brep_shape, realToCanvasMat })
  ctx.fillStyle = color
  ctx.fill("evenodd")
}
