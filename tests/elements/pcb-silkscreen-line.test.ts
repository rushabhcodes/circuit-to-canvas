import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PcbSilkscreenLine } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw silkscreen line", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const line: PcbSilkscreenLine = {
    type: "pcb_silkscreen_line",
    pcb_silkscreen_line_id: "line1",
    pcb_component_id: "component1",
    layer: "top",
    x1: 20,
    y1: 20,
    x2: 80,
    y2: 80,
    stroke_width: 2,
  }

  drawer.drawElements([line])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})
