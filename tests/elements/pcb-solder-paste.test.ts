import { expect, test } from "bun:test"
import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas"
import type { AnyCircuitElement, PcbSolderPaste } from "circuit-json"
import {
  CircuitToCanvasDrawer,
  type DrawElementsOptions,
} from "../../lib/drawer"

const BLACK = [0, 0, 0]
const SOLDER_PASTE_GRAY = [105, 105, 105]

function renderSolderPaste(
  solderPaste: PcbSolderPaste[],
  options: DrawElementsOptions,
) {
  const canvas = createCanvas(180, 80)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "rgb(0, 0, 0)"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  drawer.drawElements(solderPaste, options)

  return { ctx, drawer }
}

function getRgbAt(ctx: SKRSContext2D, x: number, y: number): number[] {
  return Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3))
}

test("solder paste is hidden by default and filtered by selected layer", () => {
  const solderPaste: PcbSolderPaste[] = [
    {
      type: "pcb_solder_paste",
      pcb_solder_paste_id: "paste_top",
      layer: "top",
      shape: "rect",
      x: 30,
      y: 40,
      width: 20,
      height: 20,
    },
    {
      type: "pcb_solder_paste",
      pcb_solder_paste_id: "paste_bottom",
      layer: "bottom",
      shape: "circle",
      x: 90,
      y: 40,
      radius: 10,
    },
  ]

  const hidden = renderSolderPaste(solderPaste, {})
  expect(getRgbAt(hidden.ctx, 30, 40)).toEqual(BLACK)
  expect(getRgbAt(hidden.ctx, 90, 40)).toEqual(BLACK)

  const topOnly = renderSolderPaste(solderPaste, {
    drawSolderPaste: true,
  })
  expect(getRgbAt(topOnly.ctx, 30, 40)).toEqual(SOLDER_PASTE_GRAY)
  expect(getRgbAt(topOnly.ctx, 90, 40)).toEqual(BLACK)

  const bottomOnly = renderSolderPaste(solderPaste, {
    drawSolderPaste: true,
    drawSolderPasteTop: false,
    drawSolderPasteBottom: true,
  })
  expect(getRgbAt(bottomOnly.ctx, 30, 40)).toEqual(BLACK)
  expect(getRgbAt(bottomOnly.ctx, 90, 40)).toEqual(SOLDER_PASTE_GRAY)
})

test("draws every supported solder paste shape using circuit-to-svg color", () => {
  const solderPaste: PcbSolderPaste[] = [
    {
      type: "pcb_solder_paste",
      pcb_solder_paste_id: "rect",
      layer: "top",
      shape: "rect",
      x: 20,
      y: 40,
      width: 20,
      height: 12,
    },
    {
      type: "pcb_solder_paste",
      pcb_solder_paste_id: "rotated_rect",
      layer: "top",
      shape: "rotated_rect",
      x: 55,
      y: 40,
      width: 24,
      height: 8,
      ccw_rotation: 90,
    },
    {
      type: "pcb_solder_paste",
      pcb_solder_paste_id: "pill",
      layer: "top",
      shape: "pill",
      x: 90,
      y: 40,
      width: 24,
      height: 12,
      radius: 6,
    },
    {
      type: "pcb_solder_paste",
      pcb_solder_paste_id: "oval",
      layer: "top",
      shape: "oval",
      x: 125,
      y: 40,
      width: 24,
      height: 12,
    },
    {
      type: "pcb_solder_paste",
      pcb_solder_paste_id: "circle",
      layer: "top",
      shape: "circle",
      x: 160,
      y: 40,
      radius: 8,
    },
  ]

  const rendered = renderSolderPaste(solderPaste, { drawSolderPaste: true })

  for (const x of [20, 55, 90, 125, 160]) {
    expect(getRgbAt(rendered.ctx, x, 40)).toEqual(SOLDER_PASTE_GRAY)
  }

  expect(getRgbAt(rendered.ctx, 55, 49)).toEqual(SOLDER_PASTE_GRAY)
  expect(getRgbAt(rendered.ctx, 64, 40)).toEqual(BLACK)
})

test("draws solder paste apertures over SMT pads", async () => {
  const canvas = createCanvas(600, 240)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "rgb(26, 26, 26)"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const elements: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "board",
      center: { x: 300, y: 120 },
      width: 580,
      height: 220,
      thickness: 1.6,
      num_layers: 2,
      material: "fr4",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "rect_pad",
      layer: "top",
      shape: "rect",
      x: 90,
      y: 120,
      width: 90,
      height: 60,
    },
    {
      type: "pcb_solder_paste",
      pcb_solder_paste_id: "rect_paste",
      layer: "top",
      shape: "rect",
      x: 90,
      y: 120,
      width: 64,
      height: 38,
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "circle_pad",
      layer: "top",
      shape: "circle",
      x: 230,
      y: 120,
      radius: 42,
    },
    {
      type: "pcb_solder_paste",
      pcb_solder_paste_id: "circle_paste",
      layer: "top",
      shape: "circle",
      x: 230,
      y: 120,
      radius: 27,
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pill_pad",
      layer: "top",
      shape: "pill",
      x: 370,
      y: 120,
      width: 100,
      height: 60,
      radius: 30,
    },
    {
      type: "pcb_solder_paste",
      pcb_solder_paste_id: "pill_paste",
      layer: "top",
      shape: "pill",
      x: 370,
      y: 120,
      width: 72,
      height: 36,
      radius: 18,
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "rotated_rect_pad",
      layer: "top",
      shape: "rotated_rect",
      x: 510,
      y: 120,
      width: 90,
      height: 52,
      ccw_rotation: 30,
    },
    {
      type: "pcb_solder_paste",
      pcb_solder_paste_id: "rotated_rect_paste",
      layer: "top",
      shape: "rotated_rect",
      x: 510,
      y: 120,
      width: 64,
      height: 32,
      ccw_rotation: 30,
    },
  ]

  drawer.drawElements(elements, {
    layers: ["top_copper"],
    drawBoardMaterial: true,
    drawSoldermask: true,
    drawSolderPaste: true,
  })

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})
