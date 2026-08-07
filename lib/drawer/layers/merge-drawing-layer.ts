import type { CanvasContext } from "../types"

type PatternRepetition = "repeat" | "repeat-x" | "repeat-y" | "no-repeat" | null

interface PatternCapableContext extends CanvasContext {
  createPattern(
    image: CanvasImageSource,
    repetition: PatternRepetition,
  ): CanvasPattern | null
}

function isPatternCapableContext(
  ctx: CanvasContext,
): ctx is PatternCapableContext {
  return (
    "createPattern" in ctx &&
    typeof Reflect.get(ctx, "createPattern") === "function"
  )
}

export function mergeDrawingLayer(
  baseCtx: CanvasContext,
  layerCtx: CanvasContext,
): boolean {
  if (baseCtx === layerCtx) return false
  if (layerCtx.canvas.width <= 0 || layerCtx.canvas.height <= 0) return false
  if (!isPatternCapableContext(baseCtx)) return false

  let pattern: CanvasPattern | null = null
  try {
    pattern = baseCtx.createPattern(
      layerCtx.canvas as CanvasImageSource,
      "no-repeat",
    )
  } catch {
    return false
  }
  if (!pattern) return false

  baseCtx.save()
  baseCtx.globalCompositeOperation = "source-over"
  baseCtx.fillStyle = pattern
  baseCtx.fillRect(0, 0, layerCtx.canvas.width, layerCtx.canvas.height)
  baseCtx.restore()
  return true
}
