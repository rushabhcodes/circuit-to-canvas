import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PCBHole } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw circular hole", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const hole: PCBHole = {
    type: "pcb_hole",
    pcb_hole_id: "hole1",
    hole_shape: "circle",
    hole_diameter: 30,
    x: 50,
    y: 50,
  }

  drawer.drawElements([hole])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})

test("draw square hole", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const hole: PCBHole = {
    type: "pcb_hole",
    pcb_hole_id: "hole1",
    hole_shape: "square",
    hole_diameter: 30,
    x: 50,
    y: 50,
  }

  drawer.drawElements([hole])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "square-hole",
  )
})

test("draw oval hole", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const hole: PCBHole = {
    type: "pcb_hole",
    pcb_hole_id: "hole1",
    hole_shape: "oval",
    hole_width: 50,
    hole_height: 30,
    x: 50,
    y: 50,
  }

  drawer.drawElements([hole])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "oval-hole",
  )
})

test("draw pill hole", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const hole: PCBHole = {
    type: "pcb_hole",
    pcb_hole_id: "hole1",
    hole_shape: "pill",
    hole_width: 60,
    hole_height: 30,
    x: 50,
    y: 50,
  }

  drawer.drawElements([hole])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "pill-hole",
  )
})
