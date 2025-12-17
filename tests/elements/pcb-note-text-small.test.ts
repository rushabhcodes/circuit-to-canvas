import { expect, test } from "bun:test"
import { createCanvas } from "canvas"
import type { PcbNoteText } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw pcb note text with small font size", async () => {
  const SCALE = 4
  const canvas = createCanvas(100 * SCALE, 100 * SCALE)
  const ctx = canvas.getContext("2d")
  ctx.scale(SCALE, SCALE)
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, canvas.width / SCALE, canvas.height / SCALE)

  const text: PcbNoteText = {
    type: "pcb_note_text",
    pcb_note_text_id: "note-small",
    text: "SMALL",
    anchor_position: { x: 50, y: 50 },
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: 2,
  }

  drawer.drawElements([text])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})
