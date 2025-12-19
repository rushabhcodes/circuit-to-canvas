import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import { identity } from "transformation-matrix"
import { drawOval } from "../../lib/drawer/shapes/oval"

test("draw oval", async () => {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 100, 100)

  drawOval({
    ctx,
    center: { x: 50, y: 50 },
    width: 70,
    height: 40,
    fill: "#0000ff",
    realToCanvasMat: identity(),
  })

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})
