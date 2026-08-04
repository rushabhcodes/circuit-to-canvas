import type {
  AnyCircuitElement,
  LayerRef,
  PCBKeepout,
  PcbBoard,
  PcbCopperPour,
  PcbCopperText,
  PcbCourtyardCircle,
  PcbCourtyardOutline,
  PcbCourtyardRect,
  PcbCutout,
  PcbFabricationNoteDimension,
  PcbFabricationNotePath,
  PcbFabricationNoteRect,
  PcbFabricationNoteText,
  PcbHole,
  PcbNoteDimension,
  PcbNoteLine,
  PcbNotePath,
  PcbNoteRect,
  PcbNoteText,
  PcbPanel,
  PcbPlatedHole,
  PcbRenderLayer,
  PcbSilkscreenCircle,
  PcbSilkscreenLine,
  PcbSilkscreenOval,
  PcbSilkscreenPath,
  PcbSilkscreenPill,
  PcbSilkscreenRect,
  PcbSilkscreenText,
  PcbSmtPad,
  PcbTrace,
  PcbVia,
} from "circuit-json"
import type { Matrix } from "transformation-matrix"
import { compose, identity, scale, translate } from "transformation-matrix"
import { drawPcbBoard } from "./elements/pcb-board"
import { drawPcbCopperPour } from "./elements/pcb-copper-pour"
import { drawPcbCopperText } from "./elements/pcb-copper-text"
import { drawPcbCourtyardCircle } from "./elements/pcb-courtyard-circle"
import { drawPcbCourtyardOutline } from "./elements/pcb-courtyard-outline"
import { drawPcbCourtyardRect } from "./elements/pcb-courtyard-rect"
import { drawPcbCutout } from "./elements/pcb-cutout"
import { drawPcbFabricationNoteDimension } from "./elements/pcb-fabrication-note-dimension"
import { drawPcbFabricationNotePath } from "./elements/pcb-fabrication-note-path"
import { drawPcbFabricationNoteRect } from "./elements/pcb-fabrication-note-rect"
import { drawPcbFabricationNoteText } from "./elements/pcb-fabrication-note-text"
import { drawPcbHole } from "./elements/pcb-hole"
import { drawPcbKeepout } from "./elements/pcb-keepout"
import { drawPcbNoteDimension } from "./elements/pcb-note-dimension"
import { drawPcbNoteLine } from "./elements/pcb-note-line"
import { drawPcbNotePath } from "./elements/pcb-note-path"
import { drawPcbNoteRect } from "./elements/pcb-note-rect"
import { drawPcbNoteText } from "./elements/pcb-note-text"
import { drawPcbPanelElement } from "./elements/pcb-panel"
import { drawPcbPlatedHole } from "./elements/pcb-plated-hole"
import { drawPcbSilkscreenCircle } from "./elements/pcb-silkscreen-circle"
import { drawPcbSilkscreenLine } from "./elements/pcb-silkscreen-line"
import { drawPcbSilkscreenOval } from "./elements/pcb-silkscreen-oval"
import { drawPcbSilkscreenPath } from "./elements/pcb-silkscreen-path"
import { drawPcbSilkscreenPill } from "./elements/pcb-silkscreen-pill"
import { drawPcbSilkscreenRect } from "./elements/pcb-silkscreen-rect"
import { drawPcbSilkscreenText } from "./elements/pcb-silkscreen-text"
import { drawPcbSmtPad } from "./elements/pcb-smtpad"
import { drawPcbSolderPaste } from "./elements/pcb-solder-paste"
import { drawPcbSoldermask } from "./elements/pcb-soldermask"
import { drawPcbTrace } from "./elements/pcb-trace/pcb-trace"
import { drawPcbVia } from "./elements/pcb-via"
import { shouldDrawElement } from "./pcb-render-layer-filter"
import {
  type CameraBounds,
  type CanvasContext,
  DEFAULT_PCB_COLOR_MAP,
  type DrawerConfig,
  type PcbColorMap,
} from "./types"

export interface DrawElementsOptions {
  layers?: PcbRenderLayer[]
  /** Whether to render the soldermask layer. Defaults to false. */
  drawSoldermask?: boolean
  /** Whether to render pcb_solder_paste elements. Defaults to false. */
  drawSolderPaste?: boolean
  /** Render top solder-paste elements when drawSolderPaste is enabled. Defaults to true if both layer flags are unset. */
  drawSolderPasteTop?: boolean
  /** Render bottom solder-paste elements when drawSolderPaste is enabled. */
  drawSolderPasteBottom?: boolean
  /** Render top soldermask layer when drawSoldermask is enabled. Defaults to true if both layer flags are unset. */
  drawSoldermaskTop?: boolean
  /** Render bottom soldermask layer when drawSoldermask is enabled. */
  drawSoldermaskBottom?: boolean
  /** Whether to render the board material (substrate fill). Defaults to false. */
  drawBoardMaterial?: boolean
  /** Minimum on-screen outline stroke width for pcb_board only. */
  minBoardOutlineStrokePx?: number
  /** Whether to render pcb_note elements. Defaults to true. */
  showPcbNotes?: boolean
}

interface CanvasLike {
  getContext(contextId: "2d"): CanvasContext | null
}

function getCopperLayer(layers?: PcbRenderLayer[]): LayerRef {
  if (!layers || layers.length === 0) return "top"
  const copperLayer = layers.find((candidate) => candidate.endsWith("_copper"))
  return copperLayer
    ? (copperLayer.slice(0, -"_copper".length) as LayerRef)
    : "top"
}

const isOnCopperLayer = (element: PcbVia | PcbPlatedHole, layer: LayerRef) =>
  element.layers?.includes(layer) ?? true

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
        copperPour: {
          ...this.colorMap.copperPour,
          ...config.colorOverrides.copperPour,
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
    const layer = getCopperLayer(options.layers)

    // Find the board or panel element
    const board = elements.find((el) => el.type === "pcb_board") as
      | PcbBoard
      | undefined
    const panel = elements.find((el) => el.type === "pcb_panel") as
      | PcbPanel
      | undefined

    // Drawing order:
    // 1. Panel outline (outer boundary)
    // 2. Board outline (inner board)
    // 3. Copper elements underneath soldermask (pads, copper text)
    // 4. Soldermask (covers everything except openings)
    // 5. Solder paste (on soldermask/copper, under silkscreen)
    // 6. Silkscreen (on soldermask, under top copper layers)
    // 7. Copper pour and traces (drawn on top of soldermask and silkscreen)
    // 8. Holes (drill) on top of copper and soldermask
    // 9. Plated holes, vias (copper ring + drill hole on top of soldermask)
    // 10. Cutouts (punch through everything)
    // 11. Other annotations

    // Step 1: Draw panel outline (outer boundary)
    if (panel) {
      drawPcbPanelElement({
        ctx: this.ctx,
        panel,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
        drawBoardMaterial: false,
      })
    }

    const drawBoardMaterial = options.drawBoardMaterial ?? false
    const drawSoldermask = options.drawSoldermask ?? false
    const drawSolderPaste = options.drawSolderPaste ?? false
    const hasExplicitSoldermaskLayers =
      options.drawSoldermaskTop !== undefined ||
      options.drawSoldermaskBottom !== undefined
    const hasExplicitSolderPasteLayers =
      options.drawSolderPasteTop !== undefined ||
      options.drawSolderPasteBottom !== undefined
    const renderTopSoldermask =
      drawSoldermask &&
      (board !== undefined || panel !== undefined) &&
      (options.drawSoldermaskTop ?? !hasExplicitSoldermaskLayers)
    const renderBottomSoldermask =
      drawSoldermask &&
      (board !== undefined || panel !== undefined) &&
      (options.drawSoldermaskBottom ?? false)
    const renderTopSolderPaste =
      drawSolderPaste &&
      (options.drawSolderPasteTop ?? !hasExplicitSolderPasteLayers) &&
      elements.some(
        (element) =>
          element.type === "pcb_solder_paste" && element.layer === "top",
      )
    const renderBottomSolderPaste =
      drawSolderPaste &&
      (options.drawSolderPasteBottom ?? false) &&
      elements.some(
        (element) =>
          element.type === "pcb_solder_paste" && element.layer === "bottom",
      )
    const renderTopLayerOverlay = renderTopSoldermask || renderTopSolderPaste
    const drawableVias = elements.filter(
      (el): el is PcbVia =>
        shouldDrawElement(el, options) &&
        el.type === "pcb_via" &&
        isOnCopperLayer(el, layer),
    )
    const drawableHoles = elements.filter(
      (el): el is PcbHole =>
        shouldDrawElement(el, options) && el.type === "pcb_hole",
    )
    const drawablePlatedHoles = elements.filter(
      (el): el is PcbPlatedHole =>
        shouldDrawElement(el, options) &&
        el.type === "pcb_plated_hole" &&
        isOnCopperLayer(el, layer),
    )
    const drawableCutouts = elements.filter(
      (el): el is PcbCutout =>
        shouldDrawElement(el, options) && el.type === "pcb_cutout",
    )

    // Step 2: Draw board outline/material (inner board)
    if (board) {
      drawPcbBoard({
        ctx: this.ctx,
        board,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
        drawBoardMaterial,
        minBoardOutlineStrokePx: options.minBoardOutlineStrokePx,
      })
    }

    // Step 2: Draw copper pours first so pads render on top of pours.
    for (const element of elements) {
      if (!shouldDrawElement(element, options)) continue

      if (element.type === "pcb_copper_pour") {
        drawPcbCopperPour({
          ctx: this.ctx,
          pour: element as PcbCopperPour,
          realToCanvasMat: this.realToCanvasMat,
          colorMap: this.colorMap,
        })
      }
    }

    // Step 3: Draw copper elements underneath soldermask (pads, copper text)
    for (const element of elements) {
      if (!shouldDrawElement(element, options)) continue

      if (element.type === "pcb_smtpad") {
        drawPcbSmtPad({
          ctx: this.ctx,
          pad: element as PcbSmtPad,
          realToCanvasMat: this.realToCanvasMat,
          colorMap: this.colorMap,
          holes: drawableHoles,
          platedHoles: drawablePlatedHoles,
          vias: drawableVias,
          cutouts: drawableCutouts,
        })
      }

      if (element.type === "pcb_copper_text") {
        drawPcbCopperText({
          ctx: this.ctx,
          text: element as PcbCopperText,
          realToCanvasMat: this.realToCanvasMat,
          colorMap: this.colorMap,
        })
      }
    }

    // Draw traces and drills before soldermask/paste so overlays stay on top.
    if (renderTopLayerOverlay) {
      for (const element of elements) {
        if (!shouldDrawElement(element, options)) continue

        if (element.type === "pcb_trace") {
          drawPcbTrace({
            ctx: this.ctx,
            trace: element as PcbTrace,
            realToCanvasMat: this.realToCanvasMat,
            colorMap: this.colorMap,
            vias: drawableVias,
            platedHoles: drawablePlatedHoles,
          })
        }
      }

      for (const element of elements) {
        if (!shouldDrawElement(element, options)) continue

        if (element.type === "pcb_hole") {
          drawPcbHole({
            ctx: this.ctx,
            hole: element as PcbHole,
            realToCanvasMat: this.realToCanvasMat,
            colorMap: this.colorMap,
            soldermaskMargin: renderTopSoldermask
              ? element.soldermask_margin
              : undefined,
            drawSoldermask: renderTopSoldermask,
          })
        }

        if (
          element.type === "pcb_plated_hole" &&
          isOnCopperLayer(element, layer)
        ) {
          drawPcbPlatedHole({
            ctx: this.ctx,
            hole: element as PcbPlatedHole,
            realToCanvasMat: this.realToCanvasMat,
            colorMap: this.colorMap,
            soldermaskMargin: renderTopSoldermask
              ? (element as PcbPlatedHole).soldermask_margin
              : undefined,
            drawSoldermask: renderTopSoldermask,
            layer,
          })
        }

        if (element.type === "pcb_via" && isOnCopperLayer(element, layer)) {
          drawPcbVia({
            ctx: this.ctx,
            via: element as PcbVia,
            realToCanvasMat: this.realToCanvasMat,
            colorMap: this.colorMap,
            layer,
          })
        }
      }
    }

    // Step 4: Draw soldermask layer (only if showSoldermask is true)
    if (renderTopSoldermask) {
      drawPcbSoldermask({
        ctx: this.ctx,
        elements,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
        layer: "top",
        drawSoldermask: true,
      })
    }

    // Step 5: Draw top solder paste on soldermask/copper, under silkscreen.
    if (renderTopSolderPaste) {
      for (const element of elements) {
        if (element.type !== "pcb_solder_paste" || element.layer !== "top") {
          continue
        }

        drawPcbSolderPaste({
          ctx: this.ctx,
          solderPaste: element,
          realToCanvasMat: this.realToCanvasMat,
        })
      }
    }

    // Step 6: Draw silkscreen (on soldermask, under top copper layers)
    for (const element of elements) {
      if (!shouldDrawElement(element, options)) continue

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
    }

    // Step 7: Draw copper pour and traces (on top of soldermask and silkscreen)
    for (const element of elements) {
      if (!shouldDrawElement(element, options)) continue

      if (element.type === "pcb_trace" && !renderTopLayerOverlay) {
        drawPcbTrace({
          ctx: this.ctx,
          trace: element as PcbTrace,
          realToCanvasMat: this.realToCanvasMat,
          colorMap: this.colorMap,
          vias: drawableVias,
          platedHoles: drawablePlatedHoles,
        })
      }
    }

    // Step 8: Draw holes (drill) on top of copper and soldermask
    for (const element of elements) {
      if (!shouldDrawElement(element, options)) continue

      if (element.type === "pcb_hole" && !renderTopLayerOverlay) {
        drawPcbHole({
          ctx: this.ctx,
          hole: element as PcbHole,
          realToCanvasMat: this.realToCanvasMat,
          colorMap: this.colorMap,
          soldermaskMargin: renderTopSoldermask
            ? element.soldermask_margin
            : undefined,
          drawSoldermask: renderTopSoldermask,
        })
      }
    }

    // Step 9: Draw plated holes, vias (copper ring + drill hole on top of soldermask)
    for (const element of elements) {
      if (!shouldDrawElement(element, options)) continue

      if (
        element.type === "pcb_plated_hole" &&
        !renderTopLayerOverlay &&
        isOnCopperLayer(element, layer)
      ) {
        drawPcbPlatedHole({
          ctx: this.ctx,
          hole: element as PcbPlatedHole,
          realToCanvasMat: this.realToCanvasMat,
          colorMap: this.colorMap,
          soldermaskMargin: renderTopSoldermask
            ? (element as PcbPlatedHole).soldermask_margin
            : undefined,
          drawSoldermask: renderTopSoldermask,
          layer,
        })
      }

      if (
        element.type === "pcb_via" &&
        !renderTopLayerOverlay &&
        isOnCopperLayer(element, layer)
      ) {
        drawPcbVia({
          ctx: this.ctx,
          via: element as PcbVia,
          realToCanvasMat: this.realToCanvasMat,
          colorMap: this.colorMap,
          layer,
        })
      }
    }

    // Draw bottom soldermask after copper so board material stays underneath mask.
    if (renderBottomSoldermask) {
      drawPcbSoldermask({
        ctx: this.ctx,
        elements,
        realToCanvasMat: this.realToCanvasMat,
        colorMap: this.colorMap,
        layer: "bottom",
        drawSoldermask: true,
      })
    }

    // Bottom paste is drawn after bottom soldermask so it remains visible.
    if (renderBottomSolderPaste) {
      for (const element of elements) {
        if (element.type !== "pcb_solder_paste" || element.layer !== "bottom") {
          continue
        }

        drawPcbSolderPaste({
          ctx: this.ctx,
          solderPaste: element,
          realToCanvasMat: this.realToCanvasMat,
        })
      }
    }

    // Step 10: Draw cutouts (these punch through everything)
    for (const element of elements) {
      if (!shouldDrawElement(element, options)) continue

      if (element.type === "pcb_cutout") {
        drawPcbCutout({
          ctx: this.ctx,
          cutout: element as PcbCutout,
          realToCanvasMat: this.realToCanvasMat,
          colorMap: this.colorMap,
        })
      }
    }

    // Step 11: Draw other annotations
    for (const element of elements) {
      if (!shouldDrawElement(element, options)) continue

      if (element.type === "pcb_keepout") {
        drawPcbKeepout({
          ctx: this.ctx,
          keepout: element as PCBKeepout,
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

      const showPcbNotes = options.showPcbNotes ?? true

      if (showPcbNotes && element.type === "pcb_note_rect") {
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

      if (showPcbNotes && element.type === "pcb_note_path") {
        drawPcbNotePath({
          ctx: this.ctx,
          path: element as PcbNotePath,
          realToCanvasMat: this.realToCanvasMat,
          colorMap: this.colorMap,
        })
      }

      if (showPcbNotes && element.type === "pcb_note_text") {
        drawPcbNoteText({
          ctx: this.ctx,
          text: element as PcbNoteText,
          realToCanvasMat: this.realToCanvasMat,
          colorMap: this.colorMap,
        })
      }

      if (showPcbNotes && element.type === "pcb_note_line") {
        drawPcbNoteLine({
          ctx: this.ctx,
          line: element as PcbNoteLine,
          realToCanvasMat: this.realToCanvasMat,
          colorMap: this.colorMap,
        })
      }

      if (showPcbNotes && element.type === "pcb_note_dimension") {
        drawPcbNoteDimension({
          ctx: this.ctx,
          pcbNoteDimension: element as PcbNoteDimension,
          realToCanvasMat: this.realToCanvasMat,
          colorMap: this.colorMap,
        })
      }

      if (element.type === "pcb_fabrication_note_dimension") {
        drawPcbFabricationNoteDimension({
          ctx: this.ctx,
          pcbFabricationNoteDimension: element as PcbFabricationNoteDimension,
          realToCanvasMat: this.realToCanvasMat,
          colorMap: this.colorMap,
        })
      }

      if (element.type === "pcb_courtyard_circle") {
        drawPcbCourtyardCircle({
          ctx: this.ctx,
          circle: element as PcbCourtyardCircle,
          realToCanvasMat: this.realToCanvasMat,
          colorMap: this.colorMap,
        })
      }

      if (element.type === "pcb_courtyard_rect") {
        drawPcbCourtyardRect({
          ctx: this.ctx,
          rect: element as PcbCourtyardRect,
          realToCanvasMat: this.realToCanvasMat,
          colorMap: this.colorMap,
        })
      }

      if (element.type === "pcb_courtyard_outline") {
        drawPcbCourtyardOutline({
          ctx: this.ctx,
          outline: element as PcbCourtyardOutline,
          realToCanvasMat: this.realToCanvasMat,
          colorMap: this.colorMap,
        })
      }
    }
  }
}
