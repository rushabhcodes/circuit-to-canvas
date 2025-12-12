import type { PcbComponent } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import type { PcbColorMap, CanvasContext } from "../types"
import { drawRect } from "../shapes/rect"

export interface DrawPcbComponentParams {
  ctx: CanvasContext
  component: PcbComponent
  transform: Matrix
  colorMap: PcbColorMap
}

export function drawPcbComponent(params: DrawPcbComponentParams): void {
  const { ctx, component, transform, colorMap } = params
  const { center, width, height, rotation = 0, layer = "top" } = component

  if (!center || typeof width !== "number" || typeof height !== "number") return

  drawRect({
    ctx,
    center,
    width,
    height,
    rotation,
    fill: "transparent",
    stroke: colorMap.component,
    strokeWidth: 0.5, // Thicker line for visibility
    isStrokeDashed: layer === "bottom", // Dashed for bottom layer
    transform,
  })
}
