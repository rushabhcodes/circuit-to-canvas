import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PCBVia } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw via", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const via: PCBVia = {
    type: "pcb_via",
    pcb_via_id: "via1",
    x: 50,
    y: 50,
    outer_diameter: 40,
    hole_diameter: 20,
    layers: ["top", "bottom"],
  }

  drawer.drawElements([via])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})

test("draw multiple vias", async () => {
  const canvas = createCanvas(200, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 200, 100)

  const vias: PCBVia[] = [
    {
      type: "pcb_via",
      pcb_via_id: "via1",
      x: 50,
      y: 50,
      outer_diameter: 30,
      hole_diameter: 15,
      layers: ["top", "bottom"],
    },
    {
      type: "pcb_via",
      pcb_via_id: "via2",
      x: 100,
      y: 50,
      outer_diameter: 25,
      hole_diameter: 12,
      layers: ["top", "bottom"],
    },
    {
      type: "pcb_via",
      pcb_via_id: "via3",
      x: 150,
      y: 50,
      outer_diameter: 35,
      hole_diameter: 18,
      layers: ["top", "bottom"],
    },
  ]

  drawer.drawElements(vias)

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "multiple-vias",
  )
})
