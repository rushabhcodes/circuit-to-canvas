import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PcbPlatedHole } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw circular plated hole", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const hole: PcbPlatedHole = {
    type: "pcb_plated_hole",
    pcb_plated_hole_id: "hole1",
    shape: "circle",
    x: 50,
    y: 50,
    outer_diameter: 50,
    hole_diameter: 25,
    layers: ["top", "bottom"],
  }

  drawer.drawElements([hole])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})

test("draw oval plated hole", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const hole: PcbPlatedHole = {
    type: "pcb_plated_hole",
    pcb_plated_hole_id: "hole1",
    shape: "oval",
    x: 50,
    y: 50,
    outer_width: 60,
    outer_height: 40,
    hole_width: 40,
    hole_height: 20,
    layers: ["top", "bottom"],
    ccw_rotation: 0,
  }

  drawer.drawElements([hole])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "oval-plated-hole",
  )
})

test("draw pill plated hole", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const hole: PcbPlatedHole = {
    type: "pcb_plated_hole",
    pcb_plated_hole_id: "hole1",
    shape: "pill",
    x: 50,
    y: 50,
    outer_width: 70,
    outer_height: 35,
    hole_width: 50,
    hole_height: 20,
    layers: ["top", "bottom"],
    ccw_rotation: 0,
  }

  drawer.drawElements([hole])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "pill-plated-hole",
  )
})
