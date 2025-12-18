import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PcbCopperPour } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw rectangular copper pour", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const pour: PcbCopperPour = {
    type: "pcb_copper_pour",
    pcb_copper_pour_id: "pour1",
    shape: "rect",
    layer: "top",
    center: { x: 50, y: 50 },
    width: 60,
    height: 40,
    covered_with_solder_mask: false,
  }

  drawer.drawElements([pour])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})

test("draw polygon copper pour", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const pour: PcbCopperPour = {
    type: "pcb_copper_pour",
    pcb_copper_pour_id: "pour1",
    shape: "polygon",
    layer: "bottom",
    points: [
      { x: 10, y: 10 },
      { x: 90, y: 10 },
      { x: 90, y: 90 },
      { x: 10, y: 90 },
    ],
    covered_with_solder_mask: false,
  }

  drawer.drawElements([pour])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "polygon-copper-pour",
  )
})

test("draw copper pour with trace", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const elements = [
    {
      type: "pcb_copper_pour" as const,
      pcb_copper_pour_id: "pour1",
      shape: "polygon" as const,
      layer: "top" as const,
      points: [
        { x: 10, y: 10 },
        { x: 90, y: 10 },
        { x: 90, y: 90 },
        { x: 10, y: 90 },
      ],
      covered_with_solder_mask: false,
    },
    {
      type: "pcb_trace" as const,
      pcb_trace_id: "trace1",
      route: [
        {
          route_type: "wire" as const,
          x: 20,
          y: 50,
          width: 5,
          layer: "top" as const,
        },
        {
          route_type: "wire" as const,
          x: 80,
          y: 50,
          width: 5,
          layer: "top" as const,
        },
      ],
    },
    {
      type: "pcb_via" as const,
      pcb_via_id: "via1",
      x: 50,
      y: 50,
      outer_diameter: 15,
      hole_diameter: 8,
      layers: ["top", "bottom"] as ("top" | "bottom")[],
    },
  ]

  drawer.drawElements(elements)

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "copper-pour-with-trace",
  )
})
