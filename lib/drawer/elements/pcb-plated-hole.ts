import type { PcbPlatedHole } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import type { PcbColorMap, CanvasContext } from "../types"
import { drawCircle } from "../shapes/circle"
import { drawRect } from "../shapes/rect"
import { drawOval } from "../shapes/oval"
import { drawPill } from "../shapes/pill"

export interface DrawPcbPlatedHoleParams {
  ctx: CanvasContext
  hole: PcbPlatedHole
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
}

export function drawPcbPlatedHole(params: DrawPcbPlatedHoleParams): void {
  const { ctx, hole, realToCanvasMat, colorMap } = params

  if (hole.shape === "circle") {
    // Draw outer copper ring
    drawCircle({
      ctx,
      center: { x: hole.x, y: hole.y },
      radius: hole.outer_diameter / 2,
      fill: colorMap.copper.top,
      realToCanvasMat,
    })

    // Draw inner drill hole
    drawCircle({
      ctx,
      center: { x: hole.x, y: hole.y },
      radius: hole.hole_diameter / 2,
      fill: colorMap.drill,
      realToCanvasMat,
    })
    return
  }

  if (hole.shape === "oval") {
    // Draw outer copper oval
    drawOval({
      ctx,
      center: { x: hole.x, y: hole.y },
      width: hole.outer_width,
      height: hole.outer_height,
      fill: colorMap.copper.top,
      realToCanvasMat,
      rotation: hole.ccw_rotation,
    })

    // Draw inner drill hole
    drawOval({
      ctx,
      center: { x: hole.x, y: hole.y },
      width: hole.hole_width,
      height: hole.hole_height,
      fill: colorMap.drill,
      realToCanvasMat,
      rotation: hole.ccw_rotation,
    })
    return
  }

  if (hole.shape === "pill") {
    // Draw outer copper pill
    drawPill({
      ctx,
      center: { x: hole.x, y: hole.y },
      width: hole.outer_width,
      height: hole.outer_height,
      fill: colorMap.copper.top,
      realToCanvasMat,
      rotation: hole.ccw_rotation,
    })

    // Draw inner drill hole
    drawPill({
      ctx,
      center: { x: hole.x, y: hole.y },
      width: hole.hole_width,
      height: hole.hole_height,
      fill: colorMap.drill,
      realToCanvasMat,
      rotation: hole.ccw_rotation,
    })
    return
  }

  if (hole.shape === "circular_hole_with_rect_pad") {
    // Draw rectangular pad
    drawRect({
      ctx,
      center: { x: hole.x, y: hole.y },
      width: hole.rect_pad_width,
      height: hole.rect_pad_height,
      fill: colorMap.copper.top,
      realToCanvasMat,
      borderRadius: (hole as any).rect_border_radius ?? 0,
    })

    // Draw circular drill hole (with offset)
    const holeX = hole.x + ((hole as any).hole_offset_x ?? 0)
    const holeY = hole.y + ((hole as any).hole_offset_y ?? 0)
    drawCircle({
      ctx,
      center: { x: holeX, y: holeY },
      radius: hole.hole_diameter / 2,
      fill: colorMap.drill,
      realToCanvasMat,
    })
    return
  }

  if (hole.shape === "pill_hole_with_rect_pad") {
    // Draw rectangular pad
    drawRect({
      ctx,
      center: { x: hole.x, y: hole.y },
      width: hole.rect_pad_width,
      height: hole.rect_pad_height,
      fill: colorMap.copper.top,
      realToCanvasMat,
      borderRadius: (hole as any).rect_border_radius ?? 0,
    })

    // Draw pill drill hole (with offset)
    const holeX = hole.x + ((hole as any).hole_offset_x ?? 0)
    const holeY = hole.y + ((hole as any).hole_offset_y ?? 0)
    drawPill({
      ctx,
      center: { x: holeX, y: holeY },
      width: hole.hole_width,
      height: hole.hole_height,
      fill: colorMap.drill,
      realToCanvasMat,
    })
    return
  }

  if (hole.shape === "rotated_pill_hole_with_rect_pad") {
    // Draw rotated rectangular pad
    drawRect({
      ctx,
      center: { x: hole.x, y: hole.y },
      width: hole.rect_pad_width,
      height: hole.rect_pad_height,
      fill: colorMap.copper.top,
      realToCanvasMat,
      borderRadius: (hole as any).rect_border_radius ?? 0,
      rotation: hole.rect_ccw_rotation,
    })

    // Draw rotated pill drill hole (with offset)
    const holeX = hole.x + ((hole as any).hole_offset_x ?? 0)
    const holeY = hole.y + ((hole as any).hole_offset_y ?? 0)
    drawPill({
      ctx,
      center: { x: holeX, y: holeY },
      width: hole.hole_width,
      height: hole.hole_height,
      fill: colorMap.drill,
      realToCanvasMat,
      rotation: hole.hole_ccw_rotation,
    })
    return
  }
}
