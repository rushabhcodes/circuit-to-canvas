import type { PCBHole } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import type { PcbColorMap, CanvasContext } from "../types"
import { drawCircle } from "../shapes/circle"
import { drawRect } from "../shapes/rect"
import { drawOval } from "../shapes/oval"
import { drawPill } from "../shapes/pill"

export interface DrawPcbHoleParams {
  ctx: CanvasContext
  hole: PCBHole
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
}

export function drawPcbHole(params: DrawPcbHoleParams): void {
  const { ctx, hole, realToCanvasMat, colorMap } = params

  if (hole.hole_shape === "circle") {
    drawCircle({
      ctx,
      center: { x: hole.x, y: hole.y },
      radius: hole.hole_diameter / 2,
      fill: colorMap.drill,
      realToCanvasMat,
    })
    return
  }

  if (hole.hole_shape === "square") {
    drawRect({
      ctx,
      center: { x: hole.x, y: hole.y },
      width: hole.hole_diameter,
      height: hole.hole_diameter,
      fill: colorMap.drill,
      realToCanvasMat,
    })
    return
  }

  if (hole.hole_shape === "oval") {
    drawOval({
      ctx,
      center: { x: hole.x, y: hole.y },
      width: hole.hole_width,
      height: hole.hole_height,
      fill: colorMap.drill,
      realToCanvasMat,
    })
    return
  }

  if (hole.hole_shape === "rect") {
    drawRect({
      ctx,
      center: { x: hole.x, y: hole.y },
      width: hole.hole_width,
      height: hole.hole_height,
      fill: colorMap.drill,
      realToCanvasMat,
    })
    return
  }

  if (hole.hole_shape === "pill") {
    drawPill({
      ctx,
      center: { x: hole.x, y: hole.y },
      width: hole.hole_width,
      height: hole.hole_height,
      fill: colorMap.drill,
      realToCanvasMat,
    })
    return
  }

  if (hole.hole_shape === "rotated_pill") {
    drawPill({
      ctx,
      center: { x: hole.x, y: hole.y },
      width: hole.hole_width,
      height: hole.hole_height,
      fill: colorMap.drill,
      realToCanvasMat,
      rotation: (hole as any).ccw_rotation ?? 0,
    })
    return
  }
}
