import { expect, test } from "bun:test"
import { createCanvas } from "canvas"
import type { PcbNoteRect } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw pcb note rect with dashed stroke and no fill", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const rect: PcbNoteRect = {
    type: "pcb_note_rect",
    pcb_note_rect_id: "note_rect2",
    center: { x: 50, y: 50 },
    width: 60,
    height: 40,
    stroke_width: 2,
    is_filled: false,
    has_stroke: true,
    is_stroke_dashed: true,
    color: "#0000FF", // Blue color
  }

  drawer.drawElements([rect])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})
