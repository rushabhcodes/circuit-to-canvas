import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import { identity } from "transformation-matrix"
import { drawPill } from "../../lib/drawer/shapes/pill"

test("draw horizontal pill", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  drawPill({
    ctx,
    center: { x: 50, y: 50 },
    width: 70,
    height: 30,
    fill: "#ff00ff",
    realToCanvasMat: identity(),
  })

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})

test("draw vertical pill", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  drawPill({
    ctx,
    center: { x: 50, y: 50 },
    width: 30,
    height: 70,
    fill: "#ff00ff",
    realToCanvasMat: identity(),
  })

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "pill-vertical",
  )
})
