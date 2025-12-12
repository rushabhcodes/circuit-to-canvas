import { expect, test } from "bun:test"
import { createCanvas } from "canvas"
import type { AnyCircuitElement, PcbSmtPad } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"

test("draw rats nest", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  // Create circuit elements: two pads in the same net
  const pad1: PcbSmtPad = {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad1",
    x: 20,
    y: 20,
    shape: "rect",
    width: 5,
    height: 5,
    layer: "top",
    port_hints: ["1"],
  }

  const pad2: PcbSmtPad = {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad2",
    x: 80,
    y: 80,
    shape: "rect",
    width: 5,
    height: 5,
    layer: "top",
    port_hints: ["1"],
  }

  const circuitJson: AnyCircuitElement[] = [pad1, pad2]

  // Create connectivity map
  const netMap = {
    net1: ["pad1", "pad2"],
  }
  const connectivity = new ConnectivityMap(netMap)

  drawer.setCameraBounds({ minX: 0, maxX: 100, minY: 0, maxY: 100 })
  drawer.drawElements(circuitJson)
  drawer.drawRatsNest(circuitJson, connectivity)

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})
