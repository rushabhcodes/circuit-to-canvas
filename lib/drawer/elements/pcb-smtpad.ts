import type { PcbSmtPad } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import type { PcbColorMap, CanvasContext } from "../types"
import { drawCircle } from "../shapes/circle"
import { drawRect } from "../shapes/rect"
import { drawPill } from "../shapes/pill"
import { drawPolygon } from "../shapes/polygon"

export interface DrawPcbSmtPadParams {
  ctx: CanvasContext
  pad: PcbSmtPad
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
}

function layerToColor(layer: string, colorMap: PcbColorMap): string {
  return (
    colorMap.copper[layer as keyof typeof colorMap.copper] ??
    colorMap.copper.top
  )
}

export function drawPcbSmtPad(params: DrawPcbSmtPadParams): void {
  const { ctx, pad, realToCanvasMat, colorMap } = params

  const color = layerToColor(pad.layer, colorMap)

  if (pad.shape === "rect") {
    drawRect({
      ctx,
      center: { x: pad.x, y: pad.y },
      width: pad.width,
      height: pad.height,
      fill: color,
      realToCanvasMat,
      borderRadius:
        (pad as { corner_radius?: number }).corner_radius ??
        pad.rect_border_radius ??
        0,
    })
    return
  }

  if (pad.shape === "rotated_rect") {
    drawRect({
      ctx,
      center: { x: pad.x, y: pad.y },
      width: pad.width,
      height: pad.height,
      fill: color,
      realToCanvasMat,
      borderRadius:
        (pad as { corner_radius?: number }).corner_radius ??
        pad.rect_border_radius ??
        0,
      rotation: pad.ccw_rotation ?? 0,
    })
    return
  }

  if (pad.shape === "circle") {
    drawCircle({
      ctx,
      center: { x: pad.x, y: pad.y },
      radius: pad.radius,
      fill: color,
      realToCanvasMat,
    })
    return
  }

  if (pad.shape === "pill") {
    drawPill({
      ctx,
      center: { x: pad.x, y: pad.y },
      width: pad.width,
      height: pad.height,
      fill: color,
      realToCanvasMat,
    })
    return
  }

  if (pad.shape === "rotated_pill") {
    drawPill({
      ctx,
      center: { x: pad.x, y: pad.y },
      width: pad.width,
      height: pad.height,
      fill: color,
      realToCanvasMat,
      rotation: pad.ccw_rotation ?? 0,
    })
    return
  }

  if (pad.shape === "polygon") {
    if (pad.points && pad.points.length >= 3) {
      drawPolygon({
        ctx,
        points: pad.points,
        fill: color,
        realToCanvasMat,
      })
    }
    return
  }
}
