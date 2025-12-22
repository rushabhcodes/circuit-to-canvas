import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PcbSmtPad } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw circular smt pad", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const pad: PcbSmtPad = {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad1",
    shape: "circle",
    x: 50,
    y: 50,
    radius: 20,
    layer: "top",
  }

  drawer.drawElements([pad])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})
