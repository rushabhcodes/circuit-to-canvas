import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PCBTrace } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw simple trace", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const trace: PCBTrace = {
    type: "pcb_trace",
    pcb_trace_id: "trace1",
    route: [
      { route_type: "wire", x: 20, y: 50, width: 5, layer: "top" },
      { route_type: "wire", x: 80, y: 50, width: 5, layer: "top" },
    ],
  }

  drawer.drawElements([trace])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})

test("draw multi-segment trace", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const trace: PCBTrace = {
    type: "pcb_trace",
    pcb_trace_id: "trace1",
    route: [
      { route_type: "wire", x: 10, y: 10, width: 3, layer: "top" },
      { route_type: "wire", x: 50, y: 10, width: 3, layer: "top" },
      { route_type: "wire", x: 50, y: 50, width: 3, layer: "top" },
      { route_type: "wire", x: 90, y: 50, width: 3, layer: "top" },
      { route_type: "wire", x: 90, y: 90, width: 3, layer: "top" },
    ],
  }

  drawer.drawElements([trace])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "multi-segment-trace",
  )
})

test("draw trace on bottom layer", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const trace: PCBTrace = {
    type: "pcb_trace",
    pcb_trace_id: "trace1",
    route: [
      { route_type: "wire", x: 20, y: 30, width: 6, layer: "bottom" },
      { route_type: "wire", x: 80, y: 70, width: 6, layer: "bottom" },
    ],
  }

  drawer.drawElements([trace])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "bottom-layer-trace",
  )
})

test("draw multiple traces", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const traces: PCBTrace[] = [
    {
      type: "pcb_trace",
      pcb_trace_id: "trace1",
      route: [
        { route_type: "wire", x: 10, y: 30, width: 4, layer: "top" },
        { route_type: "wire", x: 90, y: 30, width: 4, layer: "top" },
      ],
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "trace2",
      route: [
        { route_type: "wire", x: 10, y: 70, width: 4, layer: "bottom" },
        { route_type: "wire", x: 90, y: 70, width: 4, layer: "bottom" },
      ],
    },
  ]

  drawer.drawElements(traces)

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "multiple-traces",
  )
})
