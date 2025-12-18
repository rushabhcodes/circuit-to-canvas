import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PcbFabricationNoteRect } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw fabrication note rect with corner radius", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const rect: PcbFabricationNoteRect = {
    type: "pcb_fabrication_note_rect",
    pcb_fabrication_note_rect_id: "rect5",
    pcb_component_id: "component1",
    center: { x: 50, y: 50 },
    width: 60,
    height: 40,
    layer: "top",
    stroke_width: 2,
    color: "#FFFF00", // Yellow color
    corner_radius: 5,
    has_stroke: true,
  }

  drawer.drawElements([rect])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})
