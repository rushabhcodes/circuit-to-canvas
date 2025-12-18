import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type { PcbSmtPad } from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw rectangular smt pad", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const pad: PcbSmtPad = {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad1",
    shape: "rect",
    x: 50,
    y: 50,
    width: 40,
    height: 20,
    layer: "top",
  }

  drawer.drawElements([pad])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})

test("draw rectangular smt pad with border radius", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const pad: PcbSmtPad = {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad1",
    shape: "rect",
    x: 50,
    y: 50,
    width: 40,
    height: 20,
    layer: "top",
    rect_border_radius: 5,
  }

  drawer.drawElements([pad])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "rect-pad-with-border-radius",
  )
})

test("draw rotated rectangular smt pad", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const pad: PcbSmtPad = {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad1",
    shape: "rotated_rect",
    x: 50,
    y: 50,
    width: 40,
    height: 20,
    layer: "top",
    ccw_rotation: 45,
  }

  drawer.drawElements([pad])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "rotated-rect-pad",
  )
})

test("draw circular smt pad", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const pad: PcbSmtPad = {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad1",
    shape: "circle",
    x: 50,
    y: 50,
    radius: 20,
    layer: "top",
  }

  drawer.drawElements([pad])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "circular-pad",
  )
})

test("draw pill smt pad", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const pad: PcbSmtPad = {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad1",
    shape: "pill",
    x: 50,
    y: 50,
    width: 50,
    height: 25,
    radius: 12.5,
    layer: "top",
  }

  drawer.drawElements([pad])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "pill-pad",
  )
})

test("draw polygon smt pad", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const pad: PcbSmtPad = {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad1",
    shape: "polygon",
    layer: "top",
    points: [
      { x: 30, y: 30 },
      { x: 70, y: 30 },
      { x: 80, y: 50 },
      { x: 70, y: 70 },
      { x: 30, y: 70 },
      { x: 20, y: 50 },
    ],
  }

  drawer.drawElements([pad])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "polygon-pad",
  )
})

test("draw bottom layer smt pad", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  const pad: PcbSmtPad = {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad1",
    shape: "rect",
    x: 50,
    y: 50,
    width: 40,
    height: 20,
    layer: "bottom",
  }

  drawer.drawElements([pad])

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "bottom-layer-pad",
  )
})
