import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PcbNoteLine } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw pcb note line with custom color", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const line: PcbNoteLine = {
    type: "pcb_note_line",
    pcb_note_line_id: "note_line_custom_color",
    x1: 10,
    y1: 10,
    x2: 90,
    y2: 90,
    stroke_width: 2,
    color: "rgba(255, 0, 255, 0.8)", // Magenta with transparency
  }

  drawer.drawElements([line])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})
