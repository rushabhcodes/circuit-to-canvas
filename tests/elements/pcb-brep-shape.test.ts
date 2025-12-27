import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import { CircuitToCanvasDrawer } from "../../lib/drawer"
import type { PcbCopperPourBRep } from "circuit-json"

test("draw simple rectangular brep shape", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const brepShape: PcbCopperPourBRep = {
    type: "pcb_copper_pour",
    pcb_copper_pour_id: "brep1",
    covered_with_solder_mask: false,
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
      inner_rings: [],
    },
  }

  drawer.drawElements([brepShape as any])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "simple-rectangular-brep",
  )
})

test("draw brep shape with hole", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const brepShape: PcbCopperPourBRep = {
    type: "pcb_copper_pour",
    pcb_copper_pour_id: "brep2",
    covered_with_solder_mask: false,
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
            { x: 35, y: 35 },
            { x: 65, y: 35 },
            { x: 65, y: 65 },
            { x: 35, y: 65 },
          ],
        },
      ],
    },
  }

  drawer.drawElements([brepShape as any])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "brep-with-hole",
  )
})

test("draw brep shape with stroke", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const brepShape: PcbCopperPourBRep = {
    type: "pcb_copper_pour",
    pcb_copper_pour_id: "brep3",
    covered_with_solder_mask: false,
    layer: "bottom",
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
      inner_rings: [],
    },
  }

  drawer.drawElements([brepShape as any])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "brep-with-stroke",
  )
})

test("draw brep shape with opacity", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const brepShape: PcbCopperPourBRep = {
    type: "pcb_copper_pour",
    pcb_copper_pour_id: "brep4",
    covered_with_solder_mask: false,
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
      inner_rings: [],
    },
  }

  drawer.drawElements([brepShape as any])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "brep-with-opacity",
  )
})
