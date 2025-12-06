import type { AnyCircuitElement, PcbPlatedHole } from "circuit-json"
import { identity, compose, translate, scale } from "transformation-matrix"
import type { Matrix } from "transformation-matrix"
import {
  type CanvasContext,
  type PcbColorMap,
  type DrawerConfig,
  type CameraBounds,
  DEFAULT_PCB_COLOR_MAP,
} from "./types"
import { drawPcbPlatedHole } from "./elements/pcb-plated-hole"

export interface DrawElementsOptions {
  layers?: string[]
}

interface CanvasLike {
  getContext(contextId: "2d"): CanvasContext | null
}

export class CircuitToCanvasDrawer {
  private ctx: CanvasContext
  private colorMap: PcbColorMap
  public realToCanvasMat: Matrix

  constructor(canvasOrContext: CanvasLike | CanvasContext) {
    // Check if it's a canvas element (works in both browser and Node.js)
    if (
      "getContext" in canvasOrContext &&
      typeof canvasOrContext.getContext === "function"
    ) {
      const ctx = canvasOrContext.getContext("2d")
      if (!ctx) {
        throw new Error("Failed to get 2D rendering context from canvas")
      }
      this.ctx = ctx
    } else {
      this.ctx = canvasOrContext as CanvasContext
    }

    this.colorMap = { ...DEFAULT_PCB_COLOR_MAP }
    this.realToCanvasMat = identity()
  }

  configure(config: DrawerConfig): void {
    if (config.colorOverrides) {
      this.colorMap = {
        ...this.colorMap,
        ...config.colorOverrides,
        copper: {
          ...this.colorMap.copper,
          ...config.colorOverrides.copper,
        },
        silkscreen: {
          ...this.colorMap.silkscreen,
          ...config.colorOverrides.silkscreen,
        },
        soldermask: {
          ...this.colorMap.soldermask,
          ...config.colorOverrides.soldermask,
        },
        soldermaskWithCopperUnderneath: {
          ...this.colorMap.soldermaskWithCopperUnderneath,
          ...config.colorOverrides.soldermaskWithCopperUnderneath,
        },
        soldermaskOverCopper: {
          ...this.colorMap.soldermaskOverCopper,
          ...config.colorOverrides.soldermaskOverCopper,
        },
      }
    }
  }

  setCameraBounds(bounds: CameraBounds): void {
    const canvas = this.ctx.canvas
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height

    const realWidth = bounds.maxX - bounds.minX
    const realHeight = bounds.maxY - bounds.minY

    const scaleX = canvasWidth / realWidth
    const scaleY = canvasHeight / realHeight
    const uniformScale = Math.min(scaleX, scaleY)

    // Center the view
    const offsetX = (canvasWidth - realWidth * uniformScale) / 2
    const offsetY = (canvasHeight - realHeight * uniformScale) / 2

    this.realToCanvasMat = compose(
      translate(offsetX, offsetY),
      scale(uniformScale, uniformScale),
      translate(-bounds.minX, -bounds.minY),
    )
  }

  drawElements(
    elements: AnyCircuitElement[],
    options: DrawElementsOptions = {},
  ): void {
    for (const element of elements) {
      this.drawElement(element, options)
    }
  }

  private drawElement(
    element: AnyCircuitElement,
    options: DrawElementsOptions,
  ): void {
    if (element.type === "pcb_plated_hole") {
      drawPcbPlatedHole({
        ctx: this.ctx,
        hole: element as PcbPlatedHole,
        transform: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }
  }
}
