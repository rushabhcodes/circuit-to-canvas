import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PcbSilkscreenText } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw silkscreen text bottom layer with rotation - tests transform order", async () => {
  const canvas = createCanvas(150, 150)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 150, 150)

  // This test verifies the transform order (translate -> rotate -> scale) is correct
  // by testing bottom layer text with various rotations
  const texts: PcbSilkscreenText[] = [
    {
      type: "pcb_silkscreen_text",
      pcb_silkscreen_text_id: "text1",
      pcb_component_id: "component1",
      layer: "bottom",
      text: "0",
      anchor_position: { x: 75, y: 30 },
      anchor_alignment: "center",
      font: "tscircuit2024",
      font_size: 6,
      ccw_rotation: 0,
    },
    {
      type: "pcb_silkscreen_text",
      pcb_silkscreen_text_id: "text2",
      pcb_component_id: "component1",
      layer: "bottom",
      text: "90",
      anchor_position: { x: 120, y: 75 },
      anchor_alignment: "center",
      font: "tscircuit2024",
      font_size: 6,
      ccw_rotation: 90,
    },
    {
      type: "pcb_silkscreen_text",
      pcb_silkscreen_text_id: "text3",
      pcb_component_id: "component1",
      layer: "bottom",
      text: "180",
      anchor_position: { x: 75, y: 120 },
      anchor_alignment: "center",
      font: "tscircuit2024",
      font_size: 6,
      ccw_rotation: 180,
    },
    {
      type: "pcb_silkscreen_text",
      pcb_silkscreen_text_id: "text4",
      pcb_component_id: "component1",
      layer: "bottom",
      text: "270",
      anchor_position: { x: 30, y: 75 },
      anchor_alignment: "center",
      font: "tscircuit2024",
      font_size: 6,
      ccw_rotation: 270,
    },
    {
      type: "pcb_silkscreen_text",
      pcb_silkscreen_text_id: "text5",
      pcb_component_id: "component1",
      layer: "bottom",
      text: "BTM",
      anchor_position: { x: 75, y: 75 },
      anchor_alignment: "center",
      font: "tscircuit2024",
      font_size: 8,
      ccw_rotation: 45,
    },
  ]

  drawer.drawElements(texts)

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})
