import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PcbBoard } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw rectangular board", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const board: PcbBoard = {
    type: "pcb_board",
    pcb_board_id: "board1",
    center: { x: 50, y: 50 },
    width: 80,
    height: 60,
    thickness: 1.6,
    num_layers: 2,
    material: "fr4",
  }

  drawer.drawElements([board])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})

test("draw board with custom outline", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  // L-shaped board outline
  const board: PcbBoard = {
    type: "pcb_board",
    pcb_board_id: "board1",
    center: { x: 50, y: 50 },
    width: 80,
    height: 80,
    thickness: 1.6,
    num_layers: 2,
    material: "fr4",
    outline: [
      { x: 10, y: 10 },
      { x: 90, y: 10 },
      { x: 90, y: 50 },
      { x: 50, y: 50 },
      { x: 50, y: 90 },
      { x: 10, y: 90 },
    ],
  }

  drawer.drawElements([board])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "custom-outline-board",
  )
})

test("draw board with elements", async () => {
  const canvas = createCanvas(200, 150)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 200, 150)

  const elements = [
    {
      type: "pcb_board" as const,
      pcb_board_id: "board1",
      center: { x: 100, y: 75 },
      width: 180,
      height: 130,
      thickness: 1.6,
      num_layers: 2,
      material: "fr4" as const,
    },
    {
      type: "pcb_smtpad" as const,
      pcb_smtpad_id: "pad1",
      shape: "rect" as const,
      x: 50,
      y: 50,
      width: 20,
      height: 10,
      layer: "top" as const,
    },
    {
      type: "pcb_smtpad" as const,
      pcb_smtpad_id: "pad2",
      shape: "rect" as const,
      x: 150,
      y: 50,
      width: 20,
      height: 10,
      layer: "top" as const,
    },
    {
      type: "pcb_trace" as const,
      pcb_trace_id: "trace1",
      route: [
        {
          route_type: "wire" as const,
          x: 50,
          y: 50,
          width: 3,
          layer: "top" as const,
        },
        {
          route_type: "wire" as const,
          x: 100,
          y: 50,
          width: 3,
          layer: "top" as const,
        },
        {
          route_type: "wire" as const,
          x: 100,
          y: 100,
          width: 3,
          layer: "top" as const,
        },
        {
          route_type: "wire" as const,
          x: 150,
          y: 100,
          width: 3,
          layer: "top" as const,
        },
      ],
    },
    {
      type: "pcb_via" as const,
      pcb_via_id: "via1",
      x: 100,
      y: 75,
      outer_diameter: 10,
      hole_diameter: 5,
      layers: ["top", "bottom"] as ("top" | "bottom")[],
    },
  ]

  drawer.drawElements(elements)

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "board-with-elements",
  )
})
