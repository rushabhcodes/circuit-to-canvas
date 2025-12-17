import type {
  PcbSilkscreenText,
  PcbSilkscreenRect,
  PcbSilkscreenCircle,
  PcbSilkscreenLine,
  PcbSilkscreenPath,
} from "circuit-json"
import type { Matrix } from "transformation-matrix"
import { applyToPoint } from "transformation-matrix"
import type { PcbColorMap, CanvasContext } from "../types"
import { drawRect } from "../shapes/rect"
import { drawCircle } from "../shapes/circle"
import { drawLine } from "../shapes/line"
import { drawPath } from "../shapes/path"

export interface DrawPcbSilkscreenTextParams {
  ctx: CanvasContext
  text: PcbSilkscreenText
  transform: Matrix
  colorMap: PcbColorMap
}

export interface DrawPcbSilkscreenRectParams {
  ctx: CanvasContext
  rect: PcbSilkscreenRect
  transform: Matrix
  colorMap: PcbColorMap
}

export interface DrawPcbSilkscreenCircleParams {
  ctx: CanvasContext
  circle: PcbSilkscreenCircle
  transform: Matrix
  colorMap: PcbColorMap
}

export interface DrawPcbSilkscreenLineParams {
  ctx: CanvasContext
  line: PcbSilkscreenLine
  transform: Matrix
  colorMap: PcbColorMap
}

export interface DrawPcbSilkscreenPathParams {
  ctx: CanvasContext
  path: PcbSilkscreenPath
  transform: Matrix
  colorMap: PcbColorMap
}

function layerToSilkscreenColor(layer: string, colorMap: PcbColorMap): string {
  return layer === "bottom"
    ? colorMap.silkscreen.bottom
    : colorMap.silkscreen.top
}

function mapAnchorAlignment(
  alignment?: string,
): "start" | "end" | "left" | "right" | "center" {
  if (!alignment) return "center"
  if (alignment.includes("left")) return "left"
  if (alignment.includes("right")) return "right"
  return "center"
}

export function drawPcbSilkscreenText(
  params: DrawPcbSilkscreenTextParams,
): void {
  const { ctx, text, transform, colorMap } = params

  const color = layerToSilkscreenColor(text.layer, colorMap)
  const [x, y] = applyToPoint(transform, [
    text.anchor_position.x,
    text.anchor_position.y,
  ])

  const fontSize = (text.font_size ?? 1) * Math.abs(transform.a)
  const rotation = text.ccw_rotation ?? 0

  ctx.save()
  ctx.translate(x, y)

  // Apply rotation (CCW rotation in degrees)
  if (rotation !== 0) {
    ctx.rotate(-rotation * (Math.PI / 180))
  }

  ctx.font = `${fontSize}px sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = mapAnchorAlignment(text.anchor_alignment)
  ctx.fillText(text.text, 0, 0)
  ctx.restore()
}

export function drawPcbSilkscreenRect(
  params: DrawPcbSilkscreenRectParams,
): void {
  const { ctx, rect, transform, colorMap } = params

  const color = layerToSilkscreenColor(rect.layer, colorMap)

  drawRect({
    ctx,
    center: rect.center,
    width: rect.width,
    height: rect.height,
    fill: color,
    transform,
  })
}

export function drawPcbSilkscreenCircle(
  params: DrawPcbSilkscreenCircleParams,
): void {
  const { ctx, circle, transform, colorMap } = params

  const color = layerToSilkscreenColor(circle.layer, colorMap)

  drawCircle({
    ctx,
    center: circle.center,
    radius: circle.radius,
    fill: color,
    transform,
  })
}

export function drawPcbSilkscreenLine(
  params: DrawPcbSilkscreenLineParams,
): void {
  const { ctx, line, transform, colorMap } = params

  const color = layerToSilkscreenColor(line.layer, colorMap)

  drawLine({
    ctx,
    start: { x: line.x1, y: line.y1 },
    end: { x: line.x2, y: line.y2 },
    strokeWidth: line.stroke_width ?? 0.1,
    stroke: color,
    transform,
  })
}

export function drawPcbSilkscreenPath(
  params: DrawPcbSilkscreenPathParams,
): void {
  const { ctx, path, transform, colorMap } = params

  const color = layerToSilkscreenColor(path.layer, colorMap)

  if (!path.route || path.route.length < 2) return

  // Draw each segment of the path
  for (let i = 0; i < path.route.length - 1; i++) {
    const start = path.route[i]
    const end = path.route[i + 1]

    if (!start || !end) continue

    drawLine({
      ctx,
      start: { x: start.x, y: start.y },
      end: { x: end.x, y: end.y },
      strokeWidth: path.stroke_width ?? 0.1,
      stroke: color,
      transform,
    })
  }
}
