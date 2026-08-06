import type { PcbSilkscreenGraphic } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import type { CanvasContext, PcbColorMap } from "../types"
import { drawBrepRing } from "./pcb-copper-pour"

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
  drawBrepRing(ctx, graphic.brep_shape.outer_ring, realToCanvasMat)
  for (const innerRing of graphic.brep_shape.inner_rings ?? []) {
    drawBrepRing(ctx, innerRing, realToCanvasMat)
  }
  ctx.fillStyle = color
  ctx.fill("evenodd")
}
