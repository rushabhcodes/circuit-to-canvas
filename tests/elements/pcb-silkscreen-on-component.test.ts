import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

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
      pcb_component_id: "component1",
      layer: "top" as const,
      center: { x: 75, y: 50 },
      width: 60,
      height: 30,
      stroke_width: 0.2,
    },
    // Pin 1 indicator
    {
      type: "pcb_silkscreen_circle" as const,
      pcb_silkscreen_circle_id: "pin1marker",
      pcb_component_id: "component1",
      layer: "top" as const,
      center: { x: 55, y: 40 },
      radius: 3,
      stroke_width: 0.2,
    },
    // Component label
    {
      type: "pcb_silkscreen_text" as const,
      pcb_silkscreen_text_id: "label1",
      pcb_component_id: "component1",
      layer: "top" as const,
      text: "IC1",
      anchor_position: { x: 75, y: 50 },
      anchor_alignment: "center" as const,
      font: "tscircuit2024" as const,
      font_size: 8,
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
  )
})
