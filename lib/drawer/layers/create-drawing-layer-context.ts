import type { CanvasContext } from "../types"

interface DrawingLayerCanvas {
  width: number
  height: number
  getContext(contextId: "2d"): CanvasContext | null
}

type DrawingLayerCanvasConstructor = new (
  width: number,
  height: number,
) => DrawingLayerCanvas

function isCanvasConstructor(
  value: unknown,
): value is DrawingLayerCanvasConstructor {
  return typeof value === "function"
}

export function createDrawingLayerContext(
  baseCtx: CanvasContext,
  width: number,
  height: number,
): CanvasContext | null {
  if (width <= 0 || height <= 0) return null

  const g = globalThis
  let layerCanvas: DrawingLayerCanvas | null = null

  if ("OffscreenCanvas" in g && typeof g.OffscreenCanvas === "function") {
    layerCanvas = new g.OffscreenCanvas(width, height)
  } else if (
    "document" in g &&
    g.document &&
    typeof g.document.createElement === "function"
  ) {
    const canvas = g.document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    layerCanvas = canvas
  } else {
    const CanvasCtor = baseCtx.canvas.constructor
    if (isCanvasConstructor(CanvasCtor)) {
      try {
        layerCanvas = new CanvasCtor(width, height)
      } catch {
        return null
      }
    }
  }

  if (!layerCanvas) return null
  return layerCanvas.getContext("2d")
}
