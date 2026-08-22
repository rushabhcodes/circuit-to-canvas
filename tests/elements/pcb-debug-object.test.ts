import { expect, test } from "bun:test"
import { SvgExportFlag, createCanvas } from "@napi-rs/canvas"
import type { PcbDebugObject } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

const debugObjects: PcbDebugObject[] = [
  {
    type: "pcb_debug_object",
    pcb_debug_object_id: "pcb_debug_object_rect",
    shape: "rect",
    center: { x: -3, y: 2 },
    size: { width: 6, height: 4 },
    label: "phase 1 bounds",
  },
  {
    type: "pcb_debug_object",
    pcb_debug_object_id: "pcb_debug_object_line",
    shape: "line",
    start: { x: -6, y: -4 },
    end: { x: 6, y: 4 },
    label: "candidate route",
  },
  {
    type: "pcb_debug_object",
    pcb_debug_object_id: "pcb_debug_object_point",
    shape: "point",
    center: { x: 4, y: -3 },
    label: "breakout",
  },
]

const createDebugCanvas = (showDebugObjects: boolean) => {
  const canvas = createCanvas(400, 300)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  drawer.setCameraBounds({ minX: -10, maxX: 10, minY: -7.5, maxY: 7.5 })
  drawer.drawElements(debugObjects, { showDebugObjects })

  return canvas
}

const createDebugSvg = () => {
  const canvas = createCanvas(400, 300, SvgExportFlag.NoPrettyXML)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  drawer.setCameraBounds({ minX: -10, maxX: 10, minY: -7.5, maxY: 7.5 })
  drawer.drawElements(debugObjects, { showDebugObjects: true })

  return canvas.getContent().toString("utf8")
}

test("PCB debug objects are opt-in", () => {
  const hiddenCanvas = createDebugCanvas(false)
  const blankCanvas = createCanvas(400, 300)
  const blankCtx = blankCanvas.getContext("2d")
  blankCtx.fillStyle = "#000"
  blankCtx.fillRect(0, 0, blankCanvas.width, blankCanvas.height)

  expect(hiddenCanvas.toBuffer("image/png")).toEqual(
    blankCanvas.toBuffer("image/png"),
  )
})

test("draws labeled PCB debug objects", () => {
  const canvas = createCanvas(400, 300)
  const ctx = canvas.getContext("2d")
  const labelPositions: Array<{ x: number; y: number }> = []
  const originalTranslate = ctx.translate.bind(ctx)
  ctx.translate = (x: number, y: number) => {
    labelPositions.push({ x, y })
    originalTranslate(x, y)
  }

  const drawer = new CircuitToCanvasDrawer(ctx)
  drawer.setCameraBounds({ minX: -10, maxX: 10, minY: -7.5, maxY: 7.5 })
  drawer.drawElements(debugObjects, { showDebugObjects: true })

  expect(labelPositions).toHaveLength(3)
  expect(canvas.toBuffer("image/png")).not.toEqual(
    createCanvas(400, 300).toBuffer("image/png"),
  )
})

test("matches the labeled PCB debug object visual snapshot", async () => {
  await expect(createDebugSvg()).toMatchSvgSnapshot(import.meta.path)
})

test("places rectangle labels above the top-left corner", () => {
  const canvas = createCanvas(400, 300)
  const ctx = canvas.getContext("2d")
  const labelPositions: Array<{ x: number; y: number }> = []
  const originalTranslate = ctx.translate.bind(ctx)
  ctx.translate = (x: number, y: number) => {
    labelPositions.push({ x, y })
    originalTranslate(x, y)
  }

  const drawer = new CircuitToCanvasDrawer(ctx)
  drawer.setCameraBounds({ minX: -10, maxX: 10, minY: -7.5, maxY: 7.5 })
  drawer.drawElements([debugObjects[0]!], { showDebugObjects: true })

  expect(labelPositions).toEqual([{ x: 80, y: 66.5 }])
})

test("stacks labels for overlapping rectangles", () => {
  const canvas = createCanvas(400, 300)
  const ctx = canvas.getContext("2d")
  const labelPositions: Array<{ x: number; y: number }> = []
  const originalTranslate = ctx.translate.bind(ctx)
  ctx.translate = (x: number, y: number) => {
    labelPositions.push({ x, y })
    originalTranslate(x, y)
  }

  const drawer = new CircuitToCanvasDrawer(ctx)
  drawer.setCameraBounds({ minX: -10, maxX: 10, minY: -7.5, maxY: 7.5 })
  drawer.drawElements(
    [
      debugObjects[0]!,
      { ...debugObjects[0]!, pcb_debug_object_id: "rect_2", label: "phase 2" },
    ],
    { showDebugObjects: true },
  )

  expect(labelPositions).toEqual([
    { x: 80, y: 66.5 },
    { x: 80, y: 53 },
  ])
})
