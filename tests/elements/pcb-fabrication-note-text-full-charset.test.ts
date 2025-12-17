import { expect, test } from "bun:test"
import { createCanvas } from "canvas"
import type { PcbFabricationNoteText } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw full character set", async () => {
  const SCALE = 4
  const canvas = createCanvas(800 * SCALE, 300 * SCALE)
  const ctx = canvas.getContext("2d")
  ctx.scale(SCALE, SCALE)
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, canvas.width / SCALE, canvas.height / SCALE)

  const fontSize = 20
  const lineHeight = 40
  let y = 30

  // Lowercase letters
  const lowercaseText: PcbFabricationNoteText = {
    type: "pcb_fabrication_note_text",
    pcb_fabrication_note_text_id: "fab-note-lowercase",
    pcb_component_id: "component1",
    layer: "top",
    text: "abcdefghijklmnopqrstuvwxyz",
    anchor_position: { x: 400, y },
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: fontSize,
  }
  drawer.drawElements([lowercaseText])
  y += lineHeight

  // Uppercase letters
  const uppercaseText: PcbFabricationNoteText = {
    type: "pcb_fabrication_note_text",
    pcb_fabrication_note_text_id: "fab-note-uppercase",
    pcb_component_id: "component2",
    layer: "top",
    text: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    anchor_position: { x: 400, y },
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: fontSize,
  }
  drawer.drawElements([uppercaseText])
  y += lineHeight

  // Numbers
  const numbersText: PcbFabricationNoteText = {
    type: "pcb_fabrication_note_text",
    pcb_fabrication_note_text_id: "fab-note-numbers",
    pcb_component_id: "component3",
    layer: "top",
    text: "0123456789",
    anchor_position: { x: 400, y },
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: fontSize,
  }
  drawer.drawElements([numbersText])
  y += lineHeight

  // Common symbols
  const symbolsText: PcbFabricationNoteText = {
    type: "pcb_fabrication_note_text",
    pcb_fabrication_note_text_id: "fab-note-symbols",
    pcb_component_id: "component4",
    layer: "top",
    text: "()!@#$%^&*",
    anchor_position: { x: 400, y },
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: fontSize,
  }
  drawer.drawElements([symbolsText])
  y += lineHeight

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "fabrication-note-text-full-charset",
  )
})
