import { expect, test } from "bun:test"
import { createCanvas } from "canvas"
import type {
  PcbSilkscreenText,
  PcbSilkscreenRect,
  PcbSilkscreenCircle,
  PcbSilkscreenLine,
  PcbSilkscreenPath,
} from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw silkscreen text", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const text: PcbSilkscreenText = {
    type: "pcb_silkscreen_text",
    pcb_silkscreen_text_id: "text1",
    pcb_component_id: "component1",
    layer: "top",
    text: "U1",
    anchor_position: { x: 50, y: 50 },
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: 8,
  }

  drawer.drawElements([text])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})

test("draw silkscreen text bottom layer", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const text: PcbSilkscreenText = {
    type: "pcb_silkscreen_text",
    pcb_silkscreen_text_id: "text1",
    pcb_component_id: "component1",
    layer: "bottom",
    text: "BOTTOM",
    anchor_position: { x: 50, y: 50 },
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: 8,
  }

  drawer.drawElements([text])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "silkscreen-text-bottom",
  )
})

test("draw silkscreen rect", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const rect: PcbSilkscreenRect = {
    type: "pcb_silkscreen_rect",
    pcb_silkscreen_rect_id: "rect1",
    pcb_component_id: "component1",
    layer: "top",
    center: { x: 50, y: 50 },
    width: 40,
    height: 20,
    stroke_width: 0.2,
  }

  drawer.drawElements([rect])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "silkscreen-rect",
  )
})

test("draw silkscreen circle", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const circle: PcbSilkscreenCircle = {
    type: "pcb_silkscreen_circle",
    pcb_silkscreen_circle_id: "circle1",
    pcb_component_id: "component1",
    layer: "top",
    center: { x: 50, y: 50 },
    radius: 20,
    stroke_width: 0.2,
  }

  drawer.drawElements([circle])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "silkscreen-circle",
  )
})

test("draw silkscreen line", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const line: PcbSilkscreenLine = {
    type: "pcb_silkscreen_line",
    pcb_silkscreen_line_id: "line1",
    pcb_component_id: "component1",
    layer: "top",
    x1: 20,
    y1: 20,
    x2: 80,
    y2: 80,
    stroke_width: 2,
  }

  drawer.drawElements([line])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "silkscreen-line",
  )
})

test("draw silkscreen path", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const path: PcbSilkscreenPath = {
    type: "pcb_silkscreen_path",
    pcb_silkscreen_path_id: "path1",
    pcb_component_id: "component1",
    layer: "top",
    route: [
      { x: 10, y: 50 },
      { x: 30, y: 20 },
      { x: 70, y: 20 },
      { x: 90, y: 50 },
      { x: 70, y: 80 },
      { x: 30, y: 80 },
      { x: 10, y: 50 },
    ],
    stroke_width: 2,
  }

  drawer.drawElements([path])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "silkscreen-path",
  )
})

test("draw silkscreen on component", async () => {
  const canvas = createCanvas(150, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 150, 100)

  const elements = [
    // Component outline
    {
      type: "pcb_silkscreen_rect" as const,
      pcb_silkscreen_rect_id: "outline1",
      layer: "top" as const,
      center: { x: 75, y: 50 },
      width: 60,
      height: 30,
      pcb_component_id: "comp1",
      stroke_width: 0.1,
    },
    // Pin 1 indicator
    {
      type: "pcb_silkscreen_circle" as const,
      pcb_silkscreen_circle_id: "pin1marker",
      layer: "top" as const,
      center: { x: 55, y: 40 },
      radius: 3,
      pcb_component_id: "comp1",
      stroke_width: 0.1,
    },
    // Component label
    {
      type: "pcb_silkscreen_text" as const,
      pcb_silkscreen_text_id: "label1",
      layer: "top" as const,
      text: "IC1",
      anchor_position: { x: 75, y: 50 },
      font_size: 8,
      font: "tscircuit2024" as const,
      anchor_alignment: "center" as const,
      pcb_component_id: "comp1",
    },
    // SMT pads
    {
      type: "pcb_smtpad" as const,
      pcb_smtpad_id: "pad1",
      shape: "rect" as const,
      x: 55,
      y: 50,
      width: 10,
      height: 5,
      layer: "top" as const,
    },
    {
      type: "pcb_smtpad" as const,
      pcb_smtpad_id: "pad2",
      shape: "rect" as const,
      x: 95,
      y: 50,
      width: 10,
      height: 5,
      layer: "top" as const,
    },
  ]

  drawer.drawElements(elements)

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "silkscreen-on-component",
  )
})
