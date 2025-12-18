import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PcbCutout } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw rectangular cutout", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const cutout: PcbCutout = {
    type: "pcb_cutout",
    pcb_cutout_id: "cutout1",
    shape: "rect",
    center: { x: 50, y: 50 },
    width: 30,
    height: 20,
  }

  drawer.drawElements([cutout])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})

test("draw circular cutout", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const cutout: PcbCutout = {
    type: "pcb_cutout",
    pcb_cutout_id: "cutout1",
    shape: "circle",
    center: { x: 50, y: 50 },
    radius: 20,
  }

  drawer.drawElements([cutout])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "circular-cutout",
  )
})

test("draw polygon cutout", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const cutout: PcbCutout = {
    type: "pcb_cutout",
    pcb_cutout_id: "cutout1",
    shape: "polygon",
    points: [
      { x: 30, y: 30 },
      { x: 70, y: 30 },
      { x: 80, y: 50 },
      { x: 70, y: 70 },
      { x: 30, y: 70 },
      { x: 20, y: 50 },
    ],
  }

  drawer.drawElements([cutout])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "polygon-cutout",
  )
})
