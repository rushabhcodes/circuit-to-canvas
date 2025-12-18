import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PcbNoteText } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw pcb note text with different anchor alignments", async () => {
  const SCALE = 4
  const canvas = createCanvas(300 * SCALE, 200 * SCALE)
  const ctx = canvas.getContext("2d")
  ctx.scale(SCALE, SCALE)
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, canvas.width / SCALE, canvas.height / SCALE)

  // Draw reference lines
  ctx.strokeStyle = "#444444"
  ctx.lineWidth = 0.5
  // Top line
  ctx.beginPath()
  ctx.moveTo(10, 50)
  ctx.lineTo(290, 50)
  ctx.stroke()
  // Center/baseline line
  ctx.beginPath()
  ctx.moveTo(10, 100)
  ctx.lineTo(290, 100)
  ctx.stroke()
  // Bottom line
  ctx.beginPath()
  ctx.moveTo(10, 150)
  ctx.lineTo(290, 150)
  ctx.stroke()

  // Test with top_left alignment
  const textTopLeft: PcbNoteText = {
    type: "pcb_note_text",
    pcb_note_text_id: "note-top-left",
    text: "TOP",
    anchor_position: { x: 50, y: 50 },
    anchor_alignment: "top_left",
    font: "tscircuit2024",
    font_size: 16,
  }

  // Test with center alignment
  const textCenter: PcbNoteText = {
    type: "pcb_note_text",
    pcb_note_text_id: "note-center",
    text: "CENTER",
    anchor_position: { x: 150, y: 100 },
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: 16,
  }

  // Test with bottom_right alignment
  const textBottomRight: PcbNoteText = {
    type: "pcb_note_text",
    pcb_note_text_id: "note-bottom-right",
    text: "BOTTOM",
    anchor_position: { x: 250, y: 150 },
    anchor_alignment: "bottom_right",
    font: "tscircuit2024",
    font_size: 16,
  }

  drawer.drawElements([textTopLeft, textCenter, textBottomRight])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})
