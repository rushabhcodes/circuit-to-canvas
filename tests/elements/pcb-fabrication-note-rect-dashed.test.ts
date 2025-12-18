import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PcbFabricationNoteRect } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw fabrication note rect with dashed stroke", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const rect: PcbFabricationNoteRect = {
    type: "pcb_fabrication_note_rect",
    pcb_fabrication_note_rect_id: "rect4",
    pcb_component_id: "component1",
    center: { x: 50, y: 50 },
    width: 60,
    height: 40,
    layer: "top",
    stroke_width: 2,
    color: "#0000FF", // Blue color
    has_stroke: true,
    is_stroke_dashed: true,
  }

  drawer.drawElements([rect])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})
