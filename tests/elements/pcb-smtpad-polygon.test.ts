import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PcbSmtPad } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw polygon smt pad", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const pad: PcbSmtPad = {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad1",
    shape: "polygon",
    layer: "top",
    points: [
      { x: 30, y: 30 },
      { x: 70, y: 30 },
      { x: 80, y: 50 },
      { x: 70, y: 70 },
      { x: 30, y: 70 },
      { x: 20, y: 50 },
    ],
  }

  drawer.drawElements([pad])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})
