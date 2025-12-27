import type {
  AnyCircuitElement,
  PcbPlatedHole,
  PcbVia,
  PcbHole,
  PcbSmtPad,
  PcbTrace,
  PcbBoard,
  PcbSilkscreenText,
  PcbSilkscreenRect,
  PcbSilkscreenCircle,
  PcbSilkscreenLine,
  PcbSilkscreenOval,
  PcbSilkscreenPath,
  PcbSilkscreenPill,
  PcbCutout,
  PcbCopperPour,
  PcbCopperText,
  PcbFabricationNoteText,
  PcbFabricationNoteRect,
  PcbNoteRect,
  PcbFabricationNotePath,
  PcbNotePath,
  PcbNoteText,
  PcbNoteDimension,
  PcbNoteLine,
  PcbRenderLayer,
} from "circuit-json"
import {
  identity,
  compose,
  translate,
  scale,
  applyToPoint,
} from "transformation-matrix"
import { shouldDrawElement } from "./pcb-render-layer-filter"
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
import { drawPath } from "./shapes/path"
import { drawRect } from "./shapes/rect"
import { drawPcbSilkscreenText } from "./elements/pcb-silkscreen-text"
import { drawPcbSilkscreenRect } from "./elements/pcb-silkscreen-rect"
import { drawPcbSilkscreenCircle } from "./elements/pcb-silkscreen-circle"
import { drawPcbSilkscreenLine } from "./elements/pcb-silkscreen-line"
import { drawPcbSilkscreenPath } from "./elements/pcb-silkscreen-path"
import { drawPcbSilkscreenOval } from "./elements/pcb-silkscreen-oval"
import { drawPcbSilkscreenPill } from "./elements/pcb-silkscreen-pill"
import { drawPcbCutout } from "./elements/pcb-cutout"
import { drawPcbCopperPour } from "./elements/pcb-copper-pour"
import { drawPcbCopperText } from "./elements/pcb-copper-text"
import { drawPcbFabricationNoteText } from "./elements/pcb-fabrication-note-text"
import { drawPcbFabricationNoteRect } from "./elements/pcb-fabrication-note-rect"
import { drawPcbNoteRect } from "./elements/pcb-note-rect"
import { drawPcbFabricationNotePath } from "./elements/pcb-fabrication-note-path"
import { drawPcbNotePath } from "./elements/pcb-note-path"
import { drawPcbNoteText } from "./elements/pcb-note-text"
import { drawPcbNoteDimension } from "./elements/pcb-note-dimension"
import { drawPcbNoteLine } from "./elements/pcb-note-line"
import { drawPcbBrepShape } from "./elements/pcb-brep-shape"

export interface DrawElementsOptions {
  layers?: PcbRenderLayer[]
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

    // Flip Y axis: PCB uses Y-up, canvas uses Y-down
    this.realToCanvasMat = compose(
      translate(offsetX, offsetY),
      scale(uniformScale, -uniformScale),
      translate(-bounds.minX, -bounds.maxY),
    )
  }

  drawElements(
    elements: AnyCircuitElement[],
    options: DrawElementsOptions = {},
  ): void {
    // Check if any pad has is_covered_with_solder_mask: true
    const hasSoldermaskPads = elements.some(
      (el) =>
        el.type === "pcb_smtpad" &&
        (el as PcbSmtPad).is_covered_with_solder_mask === true,
    )

    for (const element of elements) {
      if (element.type === "pcb_board" && hasSoldermaskPads) {
        // Draw board with soldermask fill when pads have soldermask
        this.drawBoardWithSoldermask(element as PcbBoard)
      } else {
        this.drawElement(element, options)
      }
    }
  }

  private drawBoardWithSoldermask(board: PcbBoard): void {
    const { width, height, center, outline } = board
    const layer = "top" // Default to top layer for soldermask color

    // If the board has a custom outline, draw it as a path with soldermask fill
    if (outline && Array.isArray(outline) && outline.length >= 3) {
      const soldermaskColor =
        this.colorMap.soldermask[
          layer as keyof typeof this.colorMap.soldermask
        ] ?? this.colorMap.soldermask.top

      // Draw filled path
      const canvasPoints = outline.map((p) => {
        const [x, y] = applyToPoint(this.realToCanvasMat, [p.x, p.y])
        return { x, y }
      })

      this.ctx.beginPath()
      const firstPoint = canvasPoints[0]
      if (firstPoint) {
        this.ctx.moveTo(firstPoint.x, firstPoint.y)
        for (let i = 1; i < canvasPoints.length; i++) {
          const point = canvasPoints[i]
          if (point) {
            this.ctx.lineTo(point.x, point.y)
          }
        }
        this.ctx.closePath()
      }

      this.ctx.fillStyle = soldermaskColor
      this.ctx.fill()

      // Draw outline stroke
      drawPath({
        ctx: this.ctx,
        points: outline.map((p) => ({ x: p.x, y: p.y })),
        stroke: this.colorMap.boardOutline,
        strokeWidth: 0.1,
        realToCanvasMat: this.realToCanvasMat,
        closePath: true,
      })
      return
    }

    // Otherwise draw a rectangle with soldermask fill
    if (width !== undefined && height !== undefined && center) {
      const soldermaskColor =
        this.colorMap.soldermask[
          layer as keyof typeof this.colorMap.soldermask
        ] ?? this.colorMap.soldermask.top

      // Draw filled rectangle
      drawRect({
        ctx: this.ctx,
        center,
        width,
        height,
        fill: soldermaskColor,
        realToCanvasMat: this.realToCanvasMat,
      })

      // Draw the outline stroke separately using path
      const halfWidth = width / 2
      const halfHeight = height / 2
      const corners = [
        { x: center.x - halfWidth, y: center.y - halfHeight },
        { x: center.x + halfWidth, y: center.y - halfHeight },
        { x: center.x + halfWidth, y: center.y + halfHeight },
        { x: center.x - halfWidth, y: center.y + halfHeight },
      ]

      drawPath({
        ctx: this.ctx,
        points: corners,
        stroke: this.colorMap.boardOutline,
        strokeWidth: 0.1,
        realToCanvasMat: this.realToCanvasMat,
        closePath: true,
      })
    }
  }

  private drawElement(
    element: AnyCircuitElement,
    options: DrawElementsOptions,
  ): void {
    // Check if element should be drawn based on layer options
    if (!shouldDrawElement(element, options)) {
      return
    }

    if (element.type === "pcb_plated_hole") {
      drawPcbPlatedHole({
        ctx: this.ctx,
        hole: element as PcbPlatedHole,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_via") {
      drawPcbVia({
        ctx: this.ctx,
        via: element as PcbVia,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_hole") {
      drawPcbHole({
        ctx: this.ctx,
        hole: element as PcbHole,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_smtpad") {
      drawPcbSmtPad({
        ctx: this.ctx,
        pad: element as PcbSmtPad,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_trace") {
      drawPcbTrace({
        ctx: this.ctx,
        trace: element as PcbTrace,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_board") {
      drawPcbBoard({
        ctx: this.ctx,
        board: element as PcbBoard,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_silkscreen_text") {
      drawPcbSilkscreenText({
        ctx: this.ctx,
        text: element as PcbSilkscreenText,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_silkscreen_rect") {
      drawPcbSilkscreenRect({
        ctx: this.ctx,
        rect: element as PcbSilkscreenRect,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_silkscreen_circle") {
      drawPcbSilkscreenCircle({
        ctx: this.ctx,
        circle: element as PcbSilkscreenCircle,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_silkscreen_line") {
      drawPcbSilkscreenLine({
        ctx: this.ctx,
        line: element as PcbSilkscreenLine,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_silkscreen_path") {
      drawPcbSilkscreenPath({
        ctx: this.ctx,
        path: element as PcbSilkscreenPath,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_silkscreen_pill") {
      drawPcbSilkscreenPill({
        ctx: this.ctx,
        pill: element as PcbSilkscreenPill,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_silkscreen_oval") {
      drawPcbSilkscreenOval({
        ctx: this.ctx,
        oval: element as PcbSilkscreenOval,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_cutout") {
      drawPcbCutout({
        ctx: this.ctx,
        cutout: element as PcbCutout,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_copper_pour") {
      if (element.shape === "brep") {
        drawPcbBrepShape({
          ctx: this.ctx,
          element: element as any,
          realToCanvasMat: this.realToCanvasMat,
          colorMap: this.colorMap,
        })
      } else {
        drawPcbCopperPour({
          ctx: this.ctx,
          pour: element as PcbCopperPour,
          realToCanvasMat: this.realToCanvasMat,
          colorMap: this.colorMap,
        })
      }
    }

    if (element.type === "pcb_copper_text") {
      drawPcbCopperText({
        ctx: this.ctx,
        text: element as PcbCopperText,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_fabrication_note_text") {
      drawPcbFabricationNoteText({
        ctx: this.ctx,
        text: element as PcbFabricationNoteText,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_fabrication_note_rect") {
      drawPcbFabricationNoteRect({
        ctx: this.ctx,
        rect: element as PcbFabricationNoteRect,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_note_rect") {
      drawPcbNoteRect({
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
        ctx: this.ctx,
        rect: element as PcbNoteRect,
      })
    }

    if (element.type === "pcb_fabrication_note_path") {
      drawPcbFabricationNotePath({
        ctx: this.ctx,
        path: element as PcbFabricationNotePath,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_note_path") {
      drawPcbNotePath({
        ctx: this.ctx,
        path: element as PcbNotePath,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_note_text") {
      drawPcbNoteText({
        ctx: this.ctx,
        text: element as PcbNoteText,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_note_line") {
      drawPcbNoteLine({
        ctx: this.ctx,
        line: element as PcbNoteLine,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }

    if (element.type === "pcb_note_dimension") {
      drawPcbNoteDimension({
        ctx: this.ctx,
        pcbNoteDimension: element as PcbNoteDimension,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
      })
    }
  }
}
