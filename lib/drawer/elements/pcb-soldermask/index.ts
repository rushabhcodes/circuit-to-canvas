import type {
  AnyCircuitElement,
  PcbBoard,
  PcbPanel,
  PcbPlatedHole,
  PcbVia,
} from "circuit-json"
import type { Matrix } from "transformation-matrix"
import type { CanvasContext, PcbColorMap } from "../../types"
import { createDrawingLayerContext } from "../../layers/create-drawing-layer-context"
import { mergeDrawingLayer } from "../../layers/merge-drawing-layer"
import { drawBoardSoldermask } from "./board"
import { drawPanelSoldermask } from "./panel"
import { processCutoutSoldermask } from "./cutout"
import { processCopperPourSoldermask } from "./copper-pour/copper-pour"
import { processHoleSoldermask } from "./hole"
import { processPlatedHoleSoldermask } from "./plated-hole"
import { processSmtPadSoldermask } from "./smt-pad"
import { processTraceSoldermask } from "./trace"
import { processViaSoldermask } from "./via"

export interface DrawPcbSoldermaskParams {
  ctx: CanvasContext
  elements: AnyCircuitElement[]
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
  layer: "top" | "bottom"
  drawSoldermask: boolean
}

/**
 * Draws the soldermask layer for the PCB as a unified geometry.
 *
 * The soldermask is drawn as a single unified layer that covers the entire board.
 * Elements "cut through" the soldermask using destination-out openings and selective overlays:
 *
 * 1. Draw full soldermask covering the board (dark green)
 * 2. For each element that needs an opening:
 *    - If positive/zero margin: subtract opening shape from soldermask
 *    - If negative margin: subtract inner opening and draw soldermask-over-copper ring
 * 3. For elements with is_covered_with_soldermask: draw soldermask-over-copper on top
 */
export function drawPcbSoldermask(params: DrawPcbSoldermaskParams): void {
  const { ctx, elements, realToCanvasMat, colorMap, layer, drawSoldermask } =
    params

  if (!drawSoldermask) return
  if (ctx.canvas.width <= 0 || ctx.canvas.height <= 0) return

  const boards = elements.filter(
    (el): el is PcbBoard => el.type === "pcb_board",
  )
  const panel = elements.find((el): el is PcbPanel => el.type === "pcb_panel")
  if (boards.length === 0 && !panel) return

  const soldermaskColor = colorMap.soldermask[layer] ?? colorMap.soldermask.top
  const soldermaskOverCopperColor =
    colorMap.soldermaskOverCopper[layer] ?? colorMap.soldermaskOverCopper.top
  const vias = elements.filter((el): el is PcbVia => el.type === "pcb_via")
  const platedHoles = elements.filter(
    (el): el is PcbPlatedHole => el.type === "pcb_plated_hole",
  )

  const soldermaskCtx =
    createDrawingLayerContext(ctx, ctx.canvas.width, ctx.canvas.height) ?? ctx

  // Step 1: Draw base soldermask surfaces (panel and boards).
  if (panel) {
    drawPanelSoldermask({
      ctx: soldermaskCtx,
      panel,
      realToCanvasMat,
      soldermaskColor,
    })
  }

  // Keep panel soldermask only on panel rails when boards are present.
  if (panel && boards.length > 0) {
    soldermaskCtx.save()
    soldermaskCtx.globalCompositeOperation = "destination-out"
    for (const board of boards) {
      drawBoardSoldermask({
        ctx: soldermaskCtx,
        board,
        realToCanvasMat,
        soldermaskColor: "#000",
      })
    }
    soldermaskCtx.restore()
  }

  for (const board of boards) {
    drawBoardSoldermask({
      ctx: soldermaskCtx,
      board,
      realToCanvasMat,
      soldermaskColor,
    })
  }

  // Step 2: Draw soldermask over traces and pours first so pads can open over them.
  for (const element of elements) {
    if (element.type === "pcb_trace") {
      processTraceSoldermask({
        ctx: soldermaskCtx,
        trace: element,
        realToCanvasMat,
        soldermaskOverCopperColor,
        layer,
        vias,
        platedHoles,
      })
    } else if (element.type === "pcb_copper_pour") {
      processCopperPourSoldermask({
        ctx: soldermaskCtx,
        pour: element,
        realToCanvasMat,
        soldermaskOverCopperColor,
        layer,
        elements,
      })
    }
  }

  // Step 3: Process remaining elements - draw cutouts and openings as needed
  for (const element of elements) {
    processElementSoldermask({
      ctx: soldermaskCtx,
      element,
      realToCanvasMat,
      soldermaskOverCopperColor,
      layer,
    })
  }

  mergeDrawingLayer(ctx, soldermaskCtx)
}

/**
 * Process soldermask for an element by drawing on top of the soldermask layer.
 * This subtracts openings from the soldermask layer and draws selective mask overlays.
 */
function processElementSoldermask(params: {
  ctx: CanvasContext
  element: AnyCircuitElement
  realToCanvasMat: Matrix
  soldermaskOverCopperColor: string
  layer: "top" | "bottom"
}): void {
  const { ctx, element, realToCanvasMat, soldermaskOverCopperColor, layer } =
    params

  if (element.type === "pcb_smtpad") {
    processSmtPadSoldermask({
      ctx,
      pad: element,
      realToCanvasMat,
      soldermaskOverCopperColor,
      layer,
    })
  } else if (element.type === "pcb_plated_hole") {
    processPlatedHoleSoldermask({
      ctx,
      hole: element,
      realToCanvasMat,
      soldermaskOverCopperColor,
      layer,
    })
  } else if (element.type === "pcb_hole") {
    processHoleSoldermask({
      ctx,
      hole: element,
      realToCanvasMat,
      soldermaskOverCopperColor,
    })
  } else if (element.type === "pcb_via") {
    processViaSoldermask({
      ctx,
      via: element,
      realToCanvasMat,
    })
  } else if (element.type === "pcb_cutout") {
    processCutoutSoldermask({
      ctx,
      cutout: element,
      realToCanvasMat,
    })
  } else if (element.type === "pcb_copper_pour") {
    return
  } else if (element.type === "pcb_trace") {
    return
  }
}
