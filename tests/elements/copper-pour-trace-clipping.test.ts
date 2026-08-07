import { expect, test } from "bun:test"
import { createCanvas, type Canvas } from "@napi-rs/canvas"
import type { AnyCircuitElement, PcbCopperPour, PcbTrace } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

const trace: PcbTrace = {
  type: "pcb_trace",
  pcb_trace_id: "trace_crossing_pour",
  route: [
    { route_type: "wire", x: -8, y: 0, width: 0.5, layer: "top" },
    { route_type: "wire", x: 8, y: 0, width: 0.5, layer: "top" },
  ],
}

function render(elements: AnyCircuitElement[]) {
  const canvas = createCanvas(200, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  drawer.setCameraBounds({ minX: -10, maxX: 10, minY: -5, maxY: 5 })
  drawer.drawElements(elements)

  return canvas
}

function getPixel(canvas: Canvas, x: number) {
  return Array.from(canvas.getContext("2d").getImageData(x, 50, 1, 1).data)
}

test("clips a trace exactly where it enters a rectangular copper pour", async () => {
  const pour: PcbCopperPour = {
    type: "pcb_copper_pour",
    pcb_copper_pour_id: "rectangular_pour",
    shape: "rect",
    layer: "top",
    center: { x: 0, y: 0 },
    width: 10,
    height: 8,
    covered_with_solder_mask: false,
  }

  const withTrace = render([pour, trace])
  const withoutTrace = render([pour])

  // The trace remains visible before the pour boundary at x=-5.
  expect(getPixel(withTrace, 30)).not.toEqual(getPixel(withoutTrace, 30))
  // Copper inside the pour is pixel-identical to a render with no trace.
  expect(getPixel(withTrace, 100)).toEqual(getPixel(withoutTrace, 100))

  await expect(withTrace.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "trace-clipped-at-rectangular-copper-pour",
  )
})

test("preserves a trace inside a BRep copper-pour clearance ring", async () => {
  const pour: PcbCopperPour = {
    type: "pcb_copper_pour",
    pcb_copper_pour_id: "brep_pour_with_clearance",
    shape: "brep",
    layer: "top",
    brep_shape: {
      outer_ring: {
        vertices: [
          { x: -5, y: -4 },
          { x: 5, y: -4 },
          { x: 5, y: 4 },
          { x: -5, y: 4 },
        ],
      },
      inner_rings: [
        {
          vertices: [
            { x: -4, y: -1 },
            { x: 4, y: -1 },
            { x: 4, y: 1 },
            { x: -4, y: 1 },
          ],
        },
      ],
    },
    covered_with_solder_mask: false,
  }

  const withTrace = render([pour, trace])
  const withoutTrace = render([pour])

  // The copper band between the outer boundary and clearance hides the trace.
  expect(getPixel(withTrace, 55)).toEqual(getPixel(withoutTrace, 55))
  // The finalized clearance ring leaves the signal trace visible.
  expect(getPixel(withTrace, 100)).not.toEqual(getPixel(withoutTrace, 100))

  await expect(withTrace.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "trace-preserved-in-brep-clearance-ring",
  )
})
