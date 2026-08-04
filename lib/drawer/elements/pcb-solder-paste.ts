import type { PcbSolderPaste } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import { drawCircle } from "../shapes/circle"
import { drawOval } from "../shapes/oval"
import { drawPill } from "../shapes/pill"
import { drawRect } from "../shapes/rect"
import type { CanvasContext } from "../types"

const SOLDER_PASTE_COLOR = "rgb(105, 105, 105)"

export interface DrawPcbSolderPasteParams {
  ctx: CanvasContext
  solderPaste: PcbSolderPaste
  realToCanvasMat: Matrix
}

export function drawPcbSolderPaste(params: DrawPcbSolderPasteParams): void {
  const { ctx, solderPaste, realToCanvasMat } = params
  const center = { x: solderPaste.x, y: solderPaste.y }

  if (solderPaste.shape === "rect") {
    drawRect({
      ctx,
      center,
      width: solderPaste.width,
      height: solderPaste.height,
      fill: SOLDER_PASTE_COLOR,
      realToCanvasMat,
    })
    return
  }

  if (solderPaste.shape === "rotated_rect") {
    drawRect({
      ctx,
      center,
      width: solderPaste.width,
      height: solderPaste.height,
      fill: SOLDER_PASTE_COLOR,
      realToCanvasMat,
      ccwRotationDegrees: solderPaste.ccw_rotation,
    })
    return
  }

  if (solderPaste.shape === "pill") {
    drawPill({
      ctx,
      center,
      width: solderPaste.width,
      height: solderPaste.height,
      fill: SOLDER_PASTE_COLOR,
      realToCanvasMat,
    })
    return
  }

  if (solderPaste.shape === "oval") {
    drawOval({
      ctx,
      center,
      radius_x: solderPaste.width / 2,
      radius_y: solderPaste.height / 2,
      fill: SOLDER_PASTE_COLOR,
      realToCanvasMat,
    })
    return
  }

  if (solderPaste.shape === "circle") {
    drawCircle({
      ctx,
      center,
      radius: solderPaste.radius,
      fill: SOLDER_PASTE_COLOR,
      realToCanvasMat,
    })
  }
}
