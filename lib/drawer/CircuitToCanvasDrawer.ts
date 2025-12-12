import type {
  AnyCircuitElement,
  PcbPlatedHole,
  PCBVia,
  PCBHole,
  PcbSmtPad,
  PCBTrace,
  PcbBoard,
  PcbSilkscreenText,
  PcbSilkscreenRect,
  PcbSilkscreenCircle,
  PcbSilkscreenLine,
  PcbSilkscreenPath,
  PcbCutout,
  PcbCopperPour,
  PcbCopperText,
  PcbFabricationNoteRect,
} from "circuit-json"
import type { ConnectivityMap } from "circuit-json-to-connectivity-map"
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
import { drawPcbVia } from "./elements/pcb-via"
import { drawPcbHole } from "./elements/pcb-hole"
import { drawPcbSmtPad } from "./elements/pcb-smtpad"
import { drawPcbTrace } from "./elements/pcb-trace"
import { drawPcbBoard } from "./elements/pcb-board"
import {
  drawPcbSilkscreenText,
  drawPcbSilkscreenRect,
  drawPcbSilkscreenCircle,
  drawPcbSilkscreenLine,
  drawPcbSilkscreenPath,
} from "./elements/pcb-silkscreen"
import { drawPcbCutout } from "./elements/pcb-cutout"
import { drawPcbCopperPour } from "./elements/pcb-copper-pour"
import { drawPcbCopperText } from "./elements/pcb-copper-text"
import { drawPcbFabricationNoteRect } from "./elements/pcb-fabrication-note-rect"
import { drawPcbRatsNest } from "../pcb/create-canvas-objects-from-pcb-rats-nest"

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

  drawRatsNest(
    circuitJson: AnyCircuitElement[],
    connectivity: ConnectivityMap,
  ): void {
    drawPcbRatsNest({
      ctx: this.ctx,
      circuitJson,
      connectivity,
      transform: this.realToCanvasMat,
      colorMap: this.colorMap,
    })
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

    if (element.type === "pcb_via") {
      drawPcbVia({
        ctx: this.ctx,
        via: element as PCBVia,
        transform: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_hole") {
      drawPcbHole({
        ctx: this.ctx,
        hole: element as PCBHole,
        transform: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_smtpad") {
      drawPcbSmtPad({
        ctx: this.ctx,
        pad: element as PcbSmtPad,
        transform: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_trace") {
      drawPcbTrace({
        ctx: this.ctx,
        trace: element as PCBTrace,
        transform: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_board") {
      drawPcbBoard({
        ctx: this.ctx,
        board: element as PcbBoard,
        transform: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_silkscreen_text") {
      drawPcbSilkscreenText({
        ctx: this.ctx,
        text: element as PcbSilkscreenText,
        transform: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_silkscreen_rect") {
      drawPcbSilkscreenRect({
        ctx: this.ctx,
        rect: element as PcbSilkscreenRect,
        transform: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_silkscreen_circle") {
      drawPcbSilkscreenCircle({
        ctx: this.ctx,
        circle: element as PcbSilkscreenCircle,
        transform: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_silkscreen_line") {
      drawPcbSilkscreenLine({
        ctx: this.ctx,
        line: element as PcbSilkscreenLine,
        transform: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_silkscreen_path") {
      drawPcbSilkscreenPath({
        ctx: this.ctx,
        path: element as PcbSilkscreenPath,
        transform: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_cutout") {
      drawPcbCutout({
        ctx: this.ctx,
        cutout: element as PcbCutout,
        transform: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_copper_pour") {
      drawPcbCopperPour({
        ctx: this.ctx,
        pour: element as PcbCopperPour,
        transform: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_copper_text") {
      drawPcbCopperText({
        ctx: this.ctx,
        text: element as PcbCopperText,
        transform: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_fabrication_note_rect") {
      drawPcbFabricationNoteRect({
        ctx: this.ctx,
        rect: element as PcbFabricationNoteRect,
        transform: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }
  }
}
