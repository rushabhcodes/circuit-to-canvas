import { createCanvas } from "@napi-rs/canvas"
import { getBoundsOfPcbElements } from "@tscircuit/circuit-json-util"
import type { Bounds } from "@tscircuit/math-utils"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { CircuitToCanvasDrawer } from "../../lib/drawer"
import { stackPngsVertically, svgToPng } from "./stackPngsVertically"

export interface StackedPngSvgComparisonOptions {
  width?: number
  height?: number
  padding?: number
  drawSoldermask?: boolean
  viewport?: Bounds
}

/**
 * Generate a stacked PNG comparison of circuit-to-canvas vs circuit-to-svg rendering.
 *
 * @param circuitJson - Array of circuit elements to render
 * @param options - Optional configuration for width, height, and padding
 * @returns Promise<Buffer> - Stacked PNG with both renderings labeled
 */
export async function getStackedPngSvgComparison(
  circuitJson: AnyCircuitElement[],
  options: StackedPngSvgComparisonOptions = {},
): Promise<Buffer> {
  const {
    width = 400,
    height = 800,
    padding = 4,
    drawSoldermask = false,
    viewport,
  } = options

  const bounds = viewport ?? getBoundsOfPcbElements(circuitJson)

  // Generate circuit-to-canvas PNG
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#000000"
  ctx.fillRect(0, 0, width, height)

  drawer.setCameraBounds({
    minX: bounds.minX,
    maxX: bounds.maxX,
    minY: bounds.minY,
    maxY: bounds.maxY,
  })
  drawer.drawElements(circuitJson, { drawSoldermask })

  const canvasPng = canvas.toBuffer("image/png")

  // Generate circuit-to-svg PNG
  const svg = convertCircuitJsonToPcbSvg(circuitJson, {
    width,
    height,
    viewport,
  })
  const svgPng = svgToPng(svg)

  // Stack both PNGs vertically with labels
  const stackedPng = await stackPngsVertically([
    { png: canvasPng, label: "circuit-to-canvas" },
    { png: svgPng, label: "circuit-to-svg" },
  ])

  return stackedPng
}
