import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PcbSilkscreenPath } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw silkscreen path", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const path: PcbSilkscreenPath = {
    type: "pcb_silkscreen_path",
    pcb_silkscreen_path_id: "path1",
    pcb_component_id: "component1",
    layer: "top",
    route: [
      { x: 10, y: 50 },
      { x: 30, y: 20 },
      { x: 70, y: 20 },
      { x: 90, y: 50 },
      { x: 70, y: 80 },
      { x: 30, y: 80 },
      { x: 10, y: 50 },
    ],
    stroke_width: 2,
  }

  drawer.drawElements([path])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})
