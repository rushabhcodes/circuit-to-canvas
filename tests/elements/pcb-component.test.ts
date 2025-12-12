import { expect, test } from "bun:test"
import { createCanvas } from "canvas"
import type { PcbComponent } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw component on board", async () => {
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
      type: "pcb_component" as const,
      source_component_id: "comp1",
      pcb_component_id: "pcb_comp1",
      center: { x: 110, y: 75 },
      width: 20,
      height: 10,
      layer: "top" as const,
      rotation: 0,
      obstructs_within_bounds: false,
    },
  ]

  drawer.drawElements(elements, { showComponents: true })

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "component-on-board",
  )
})

test("draw rotated component", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const component: PcbComponent = {
    type: "pcb_component",
    source_component_id: "comp1",
    pcb_component_id: "pcb_comp1",
    center: { x: 50, y: 50 },
    width: 20,
    height: 10,
    rotation: 45,
    layer: "top",
    obstructs_within_bounds: false,
  }

  drawer.drawElements([component], { showComponents: true })

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "rotated-component",
  )
})

test("draw bottom layer component", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const component: PcbComponent = {
    type: "pcb_component",
    source_component_id: "comp1",
    pcb_component_id: "pcb_comp1",
    center: { x: 50, y: 50 },
    width: 20,
    height: 10,
    layer: "bottom",
    rotation: 0,
    obstructs_within_bounds: false,
  }

  drawer.drawElements([component], { showComponents: true })

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "bottom-layer-component",
  )
})
