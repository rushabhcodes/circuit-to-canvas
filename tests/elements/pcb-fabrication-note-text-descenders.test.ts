import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PcbFabricationNoteText } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw lowercase text with descenders", async () => {
  const SCALE = 4
  const canvas = createCanvas(250 * SCALE, 100 * SCALE)
  const ctx = canvas.getContext("2d")
  ctx.scale(SCALE, SCALE)
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, canvas.width / SCALE, canvas.height / SCALE)

  // Draw reference line
  ctx.strokeStyle = "#666666"
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.moveTo(10, 50)
  ctx.lineTo(240, 50)
  ctx.stroke()

  // Test all descender letters: g, j, p, q, y
  const text: PcbFabricationNoteText = {
    type: "pcb_fabrication_note_text",
    pcb_fabrication_note_text_id: "fab-note-descenders",
    pcb_component_id: "component1",
    layer: "top",
    text: "gjpqy",
    anchor_position: { x: 125, y: 50 },
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: 24,
  }

  drawer.drawElements([text])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "fabrication-note-text-descenders",
  )
})
