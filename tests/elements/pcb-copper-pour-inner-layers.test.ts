import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { AnyCircuitElement, LayerRef, PcbRenderLayer } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

function renderCopperPourScene(
  elements: AnyCircuitElement[],
  layer: LayerRef,
): Buffer {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  drawer.drawElements(elements, {
    layers: [`${layer}_copper` as PcbRenderLayer],
  })

  return canvas.toBuffer("image/png")
}

const INNER_LAYERS = [
  "inner1",
  "inner2",
  "inner3",
  "inner4",
  "inner5",
  "inner6",
  "inner7",
  "inner8",
] as const

function createCopperPourWithTraceScene(
  layer: (typeof INNER_LAYERS)[number],
): AnyCircuitElement[] {
  return [
    {
      type: "pcb_copper_pour" as const,
      pcb_copper_pour_id: `pour_${layer}`,
      shape: "polygon" as const,
      layer,
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
      pcb_trace_id: `trace_${layer}`,
      route: [
        {
          route_type: "wire" as const,
          x: 20,
          y: 50,
          width: 5,
          layer,
        },
        {
          route_type: "wire" as const,
          x: 80,
          y: 50,
          width: 5,
          layer,
        },
      ],
    },
    {
      type: "pcb_via" as const,
      pcb_via_id: `via_${layer}`,
      x: 50,
      y: 50,
      outer_diameter: 15,
      hole_diameter: 8,
      layers: ["top", ...INNER_LAYERS, "bottom"],
    },
  ]
}

for (const layer of INNER_LAYERS) {
  test(`hide ${layer} trace covered by its copper pour`, async () => {
    const elements = createCopperPourWithTraceScene(layer)

    const withTrace = renderCopperPourScene(elements, layer)
    const withoutTrace = renderCopperPourScene(
      elements.filter((element) => element.type !== "pcb_trace"),
      layer,
    )

    expect(Buffer.compare(withTrace, withoutTrace)).toBe(0)
    await expect(withTrace).toMatchPngSnapshot(
      import.meta.path,
      `${layer}-copper-pour-with-trace`,
    )
  })
}
