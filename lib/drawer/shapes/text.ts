import { lineAlphabet } from "@tscircuit/alphabet"
import type { Matrix } from "transformation-matrix"
import { applyToPoint } from "transformation-matrix"
import type { CanvasContext } from "../types"

const GLYPH_WIDTH_RATIO = 0.62
const LETTER_SPACING_RATIO = 0.3 // Letter spacing between characters (25% of glyph width)
const SPACE_WIDTH_RATIO = 1
const STROKE_WIDTH_RATIO = 0.13
const CURVED_GLYPHS = new Set(["O", "o", "0"])

export type AlphabetLayout = {
  width: number
  height: number
  glyphWidth: number
  letterSpacing: number
  spaceWidth: number
  strokeWidth: number
}

export function getAlphabetLayout(
  text: string,
  fontSize: number,
): AlphabetLayout {
  const glyphWidth = fontSize * GLYPH_WIDTH_RATIO
  const letterSpacing = glyphWidth * LETTER_SPACING_RATIO
  const spaceWidth = glyphWidth * SPACE_WIDTH_RATIO
  const characters = Array.from(text)

  let width = 0
  characters.forEach((char, index) => {
    const advance = char === " " ? spaceWidth : glyphWidth
    width += advance
    if (index < characters.length - 1) width += letterSpacing
  })

  const strokeWidth = Math.max(fontSize * STROKE_WIDTH_RATIO, 0.35)

  return {
    width,
    height: fontSize,
    glyphWidth,
    letterSpacing,
    spaceWidth,
    strokeWidth,
  }
}

const getGlyphLines = (char: string) =>
  lineAlphabet[char] ?? lineAlphabet[char.toUpperCase()]

export type AnchorAlignment =
  | "center"
  | "top_left"
  | "top_right"
  | "bottom_left"
  | "bottom_right"
  | "left"
  | "right"
  | "top"
  | "bottom"

export function getTextStartPosition(
  alignment: AnchorAlignment,
  layout: AlphabetLayout,
): { x: number; y: number } {
  const totalWidth = layout.width + layout.strokeWidth
  const totalHeight = layout.height + layout.strokeWidth

  let x = 0
  let y = 0

  // Horizontal alignment
  if (alignment === "center") {
    x = -totalWidth / 2
  } else if (
    alignment === "top_left" ||
    alignment === "bottom_left" ||
    alignment === "left"
  ) {
    x = 0
  } else if (
    alignment === "top_right" ||
    alignment === "bottom_right" ||
    alignment === "right"
  ) {
    x = -totalWidth
  }

  // Vertical alignment
  if (alignment === "center") {
    y = -totalHeight / 2
  } else if (
    alignment === "top_left" ||
    alignment === "top_right" ||
    alignment === "top"
  ) {
    y = 0
  } else if (
    alignment === "bottom_left" ||
    alignment === "bottom_right" ||
    alignment === "bottom"
  ) {
    y = -totalHeight
  } else {
    y = 0
  }

  return { x, y }
}

export function strokeAlphabetText(
  ctx: CanvasContext,
  text: string,
  layout: AlphabetLayout,
  startX: number,
  startY: number,
): void {
  const { glyphWidth, letterSpacing, spaceWidth, height, strokeWidth } = layout
  const topY = startY
  const characters = Array.from(text)
  let cursor = startX + strokeWidth / 2

  characters.forEach((char, index) => {
    const lines = getGlyphLines(char)
    const advance = char === " " ? spaceWidth : glyphWidth

    if (CURVED_GLYPHS.has(char)) {
      const normalizedCenterY = 0.5
      const centerY = topY + normalizedCenterY * height
      const radiusX = Math.max(glyphWidth / 2 - strokeWidth / 2, strokeWidth)
      const radiusY = Math.max(height / 2 - strokeWidth / 2, strokeWidth)
      ctx.beginPath()
      ctx.ellipse(
        cursor + glyphWidth / 2,
        centerY,
        radiusX,
        radiusY,
        0,
        0,
        Math.PI * 2,
      )
      ctx.stroke()
    } else if (lines?.length) {
      ctx.beginPath()
      for (const line of lines) {
        // Convert normalized y coordinates to canvas coordinates (inverted for canvas)
        // In normalized coords: y=0 is bottom, y=1 is top
        const x1 = cursor + line.x1 * glyphWidth
        const y1 = topY + (1 - line.y1) * height
        const x2 = cursor + line.x2 * glyphWidth
        const y2 = topY + (1 - line.y2) * height
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
      }
      ctx.stroke()
    }

    cursor += advance
    if (index < characters.length - 1) {
      cursor += letterSpacing
    }
  })
}

export interface DrawTextParams {
  ctx: CanvasContext
  text: string
  x: number
  y: number
  fontSize: number
  color: string
  transform: Matrix
  anchorAlignment: AnchorAlignment
  rotation?: number
}

export function drawText(params: DrawTextParams): void {
  const {
    ctx,
    text,
    x,
    y,
    fontSize,
    color,
    transform,
    anchorAlignment,
    rotation = 0,
  } = params

  if (!text) return

  const [transformedX, transformedY] = applyToPoint(transform, [x, y])
  const scale = Math.abs(transform.a)
  const scaledFontSize = fontSize * scale
  const layout = getAlphabetLayout(text, scaledFontSize)
  const startPos = getTextStartPosition(anchorAlignment, layout)

  ctx.save()
  ctx.translate(transformedX, transformedY)

  if (rotation !== 0) {
    ctx.rotate(-rotation * (Math.PI / 180))
  }

  ctx.lineWidth = layout.strokeWidth
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.strokeStyle = color

  strokeAlphabetText(ctx, text, layout, startPos.x, startPos.y)

  ctx.restore()
}
