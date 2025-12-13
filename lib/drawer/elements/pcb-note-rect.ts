import type { PcbNoteRect } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import type { PcbColorMap, CanvasContext } from "../types"
import { drawRect } from "../shapes/rect"

export interface DrawPcbNoteRectParams {
  ctx: CanvasContext
  rect: PcbNoteRect
  transform: Matrix
  colorMap: PcbColorMap
}

export function drawPcbNoteRect(params: DrawPcbNoteRectParams): void {
  const { ctx, rect, transform, colorMap } = params

  // Use the color from the rect if provided, otherwise use a default color
  // Notes are typically shown in a distinct color
  const defaultColor = "rgb(89, 148, 220)" // White color for notes
  const color = rect.color ?? defaultColor

  const isFilled = rect.is_filled ?? false
  const hasStroke = rect.has_stroke ?? true
  const isStrokeDashed = rect.is_stroke_dashed ?? false

  drawRect({
    ctx,
    center: rect.center,
    width: rect.width,
    height: rect.height,
    fill: isFilled ? color : undefined,
    stroke: hasStroke ? color : undefined,
    strokeWidth: hasStroke ? rect.stroke_width : undefined,
    borderRadius: rect.corner_radius,
    transform,
    isStrokeDashed,
  })
}
