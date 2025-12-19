import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import { identity } from "transformation-matrix"
import { drawCircle } from "../../lib/drawer/shapes/circle"

test("draw circle", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  drawCircle({
    ctx,
    center: { x: 50, y: 50 },
    radius: 30,
    fill: "#ff0000",
    realToCanvasMat: identity(),
  })

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})
