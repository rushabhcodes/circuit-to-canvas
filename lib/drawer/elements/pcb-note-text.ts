import type { PcbNoteText } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import type { PcbColorMap, CanvasContext } from "../types"
import { drawText } from "../shapes/text"

export interface DrawPcbNoteTextParams {
  ctx: CanvasContext
  text: PcbNoteText
  transform: Matrix
  colorMap: PcbColorMap
}

const DEFAULT_NOTE_TEXT_COLOR = "rgb(89, 148, 220)" // Same color as note rect

export function drawPcbNoteText(params: DrawPcbNoteTextParams): void {
  const { ctx, text, transform, colorMap } = params

  const defaultColor = DEFAULT_NOTE_TEXT_COLOR
  const color = text.color ?? defaultColor
  const fontSize = text.font_size ?? 1 // Default to 1mm if not provided

  // Use @tscircuit/alphabet to draw text
  // Pass real-world coordinates and let drawText apply the transform
  drawText({
    ctx,
    text: text.text ?? "",
    x: text.anchor_position.x,
    y: text.anchor_position.y,
    fontSize,
    color,
    transform,
    anchorAlignment: text.anchor_alignment ?? "center",
  })
}
