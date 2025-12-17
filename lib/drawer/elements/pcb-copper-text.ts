import type { PcbCopperText } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import { applyToPoint } from "transformation-matrix"
import type { PcbColorMap, CanvasContext } from "../types"
import {
  getAlphabetLayout,
  strokeAlphabetText,
  getTextStartPosition,
  type AnchorAlignment,
} from "../shapes/text"

export interface DrawPcbCopperTextParams {
  ctx: CanvasContext
  text: PcbCopperText
  transform: Matrix
  colorMap: PcbColorMap
}

const DEFAULT_PADDING = { left: 0.2, right: 0.2, top: 0.2, bottom: 0.2 }

function layerToCopperColor(layer: string, colorMap: PcbColorMap): string {
  return (
    colorMap.copper[layer as keyof typeof colorMap.copper] ??
    colorMap.copper.top
  )
}

function mapAnchorAlignment(alignment?: string): AnchorAlignment {
  if (!alignment) return "center"
  if (alignment.includes("left")) return "left"
  if (alignment.includes("right")) return "right"
  return "center"
}

export function drawPcbCopperText(params: DrawPcbCopperTextParams): void {
  const { ctx, text, transform, colorMap } = params

  const content = text.text ?? ""
  if (!content) return

  const [x, y] = applyToPoint(transform, [
    text.anchor_position.x,
    text.anchor_position.y,
  ])
  const scale = Math.abs(transform.a)
  const fontSize = (text.font_size ?? 1) * scale
  const rotation = text.ccw_rotation ?? 0
  const padding = {
    ...DEFAULT_PADDING,
    ...text.knockout_padding,
  }
  const textColor = layerToCopperColor(text.layer, colorMap)
  const layout = getAlphabetLayout(content, fontSize)
  const totalWidth = layout.width + layout.strokeWidth
  const alignment = mapAnchorAlignment(text.anchor_alignment)
  const startPos = getTextStartPosition(alignment, layout)
  const startX = startPos.x
  const startY = startPos.y

  ctx.save()
  ctx.translate(x, y)
  if (text.is_mirrored) ctx.scale(-1, 1)
  if (rotation !== 0) ctx.rotate(-rotation * (Math.PI / 180))

  ctx.lineWidth = layout.strokeWidth
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  if (text.is_knockout) {
    const paddingLeft = padding.left * scale
    const paddingRight = padding.right * scale
    const paddingTop = padding.top * scale
    const paddingBottom = padding.bottom * scale
    // Calculate knockout rectangle to cover the text box
    const textBoxTop = startY - layout.strokeWidth / 2
    const textBoxBottom = startY + layout.height + layout.strokeWidth / 2
    const textBoxHeight = textBoxBottom - textBoxTop

    const xOffset = startX - paddingLeft
    const yOffset = textBoxTop - paddingTop
    const knockoutWidth = totalWidth + paddingLeft + paddingRight
    const knockoutHeight = textBoxHeight + paddingTop + paddingBottom

    ctx.fillStyle = textColor
    ctx.fillRect(xOffset, yOffset, knockoutWidth, knockoutHeight)

    const previousCompositeOperation = ctx.globalCompositeOperation
    ctx.globalCompositeOperation = "destination-out"
    ctx.fillStyle = "rgba(0,0,0,1)"
    ctx.strokeStyle = "rgba(0,0,0,1)"
    strokeAlphabetText(ctx, content, layout, startX, startY)
    if (previousCompositeOperation) {
      ctx.globalCompositeOperation = previousCompositeOperation
    } else {
      ctx.globalCompositeOperation = "source-over"
    }
  } else {
    ctx.strokeStyle = textColor
    strokeAlphabetText(ctx, content, layout, startX, startY)
  }
  ctx.restore()
}
