import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import { identity } from "transformation-matrix"
import { drawRect } from "../../lib/drawer/shapes/rect"

test("draw rect", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  drawRect({
    ctx,
    center: { x: 50, y: 50 },
    width: 60,
    height: 40,
    fill: "#00ff00",
    transform: identity(),
  })

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})

test("draw rect with border radius", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  drawRect({
    ctx,
    center: { x: 50, y: 50 },
    width: 60,
    height: 40,
    fill: "#00ff00",
    transform: identity(),
    borderRadius: 10,
  })

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "rect-rounded",
  )
})
