import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PcbFabricationNoteText } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw fabrication note text with rgba color", async () => {
  const SCALE = 4
  const canvas = createCanvas(100 * SCALE, 100 * SCALE)
  const ctx = canvas.getContext("2d")
  ctx.scale(SCALE, SCALE)
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, canvas.width / SCALE, canvas.height / SCALE)

  const text: PcbFabricationNoteText = {
    type: "pcb_fabrication_note_text",
    pcb_fabrication_note_text_id: "fab-note-rgba",
    pcb_component_id: "component1",
    layer: "top",
    text: "RGBA",
    anchor_position: { x: 50, y: 50 },
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: 8,
    color: "rgba(255, 0, 255, 0.8)",
  }

  drawer.drawElements([text])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})
