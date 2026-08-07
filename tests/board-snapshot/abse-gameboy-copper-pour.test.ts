import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type {
  AnyCircuitElement,
  LayerRef,
  PcbRenderLayer,
  PcbTrace,
} from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"
import gameboyPcbJson from "./abse-gameboy-1.0.16-pcb.json"

// PCB-only subset of https://tscircuit.com/abse/gameboy@1.0.16, rebuilt with
// tscircuit 0.0.2220. Non-rendered source, schematic, CAD, and DRC elements
// were removed to keep this real-circuit regression fixture reviewable.
const gameboyPcb = gameboyPcbJson as AnyCircuitElement[]
const gameboyTraces = gameboyPcb.filter(
  (element): element is PcbTrace => element.type === "pcb_trace",
)

test.each(["top", "bottom"] satisfies LayerRef[])(
  "renders abse/gameboy %s-layer copper pours and traces",
  async (layer) => {
    const canvas = createCanvas(652, 800)
    const ctx = canvas.getContext("2d")
    const drawer = new CircuitToCanvasDrawer(ctx)

    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    drawer.setCameraBounds({ minX: -53, maxX: 53, minY: -65, maxY: 65 })
    drawer.drawElements(gameboyPcb, {
      layers: [`${layer}_copper` as PcbRenderLayer],
    })

    const markedRoutePointCount = gameboyTraces.reduce(
      (count, trace) =>
        count +
        trace.route.filter(
          (point) =>
            "is_inside_copper_pour" in point &&
            point.is_inside_copper_pour === true,
        ).length,
      0,
    )
    const layerPourCount = gameboyPcb.filter(
      (element) =>
        element.type === "pcb_copper_pour" && element.layer === layer,
    ).length

    expect(gameboyTraces).toHaveLength(253)
    expect(markedRoutePointCount).toBe(290)
    expect(layerPourCount).toBe(layer === "top" ? 63 : 30)

    await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
      import.meta.path,
      `abse-gameboy-${layer}-layer`,
    )
  },
  { timeout: 60_000 },
)
