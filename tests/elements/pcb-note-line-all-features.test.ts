import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PcbNoteLine } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw pcb note line with all features", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const line: PcbNoteLine = {
    type: "pcb_note_line",
    pcb_note_line_id: "note_line1",
    pcb_component_id: "component1",
    pcb_group_id: "group1",
    subcircuit_id: "subcircuit1",
    name: "Test Note Line",
    text: "This is a test note line",
    x1: 10,
    y1: 10,
    x2: 90,
    y2: 90,
    stroke_width: 2,
    color: "#00FFFF", // Cyan color
    is_dashed: true,
  }

  drawer.drawElements([line])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})
