import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PcbSilkscreenCircle } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw silkscreen circle", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const circle: PcbSilkscreenCircle = {
    type: "pcb_silkscreen_circle",
    pcb_silkscreen_circle_id: "circle1",
    pcb_component_id: "component1",
    layer: "top",
    center: { x: 50, y: 50 },
    radius: 20,
    stroke_width: 0.2,
  }

  drawer.drawElements([circle])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})
