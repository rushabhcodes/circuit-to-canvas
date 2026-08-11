import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getStackedPngSvgComparison } from "../fixtures/getStackedPngSvgComparison"

test("draw an explicitly interpolated trace necking into pads", async () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "board1",
      center: { x: 0, y: 0 },
      width: 12,
      height: 5,
      thickness: 1.6,
      num_layers: 2,
      material: "fr4",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "left_pad",
      shape: "rect",
      x: -4.5,
      y: 0,
      width: 1.5,
      height: 2.5,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "right_pad",
      shape: "rect",
      x: 4.5,
      y: 0,
      width: 1.5,
      height: 2.5,
      layer: "top",
    },
    {
      type: "pcb_trace",
      pcb_trace_id: "necked_trace",
      // Vertex widths only blend continuously when Circuit JSON opts in.
      route_thickness_mode: "interpolated",
      route: [
        { route_type: "wire", x: -4.5, y: 0, width: 0.35, layer: "top" },
        { route_type: "wire", x: -3.25, y: 0, width: 0.35, layer: "top" },
        { route_type: "wire", x: -1.75, y: 0, width: 1.8, layer: "top" },
        { route_type: "wire", x: 1.75, y: 0, width: 1.8, layer: "top" },
        { route_type: "wire", x: 3.25, y: 0, width: 0.35, layer: "top" },
        { route_type: "wire", x: 4.5, y: 0, width: 0.35, layer: "top" },
      ],
    },
  ]

  const stackedPng = await getStackedPngSvgComparison(circuitJson, {
    width: 720,
    height: 300,
    viewport: { minX: -6, maxX: 6, minY: -2.5, maxY: 2.5 },
  })

  await expect(stackedPng).toMatchPngSnapshot(import.meta.path)
})
