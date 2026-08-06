import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PcbSilkscreenGraphic } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw pcb silkscreen graphic", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const graphic: PcbSilkscreenGraphic = {
    type: "pcb_silkscreen_graphic",
    pcb_silkscreen_graphic_id: "graphic1",
    pcb_component_id: "component1",
    layer: "top",
    shape: "brep",
    brep_shape: {
      outer_ring: {
        vertices: [
          { x: 10, y: 10 },
          { x: 90, y: 10 },
          { x: 90, y: 90 },
          { x: 10, y: 90 },
        ],
      },
      inner_rings: [
        {
          vertices: [
            { x: 35, y: 50, bulge: 1 },
            { x: 65, y: 50, bulge: 1 },
          ],
        },
      ],
    },
  }

  drawer.drawElements([graphic], { layers: ["top_silkscreen"] })

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})
