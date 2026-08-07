import type {
  LayerRef,
  PcbCopperPour,
  PcbPlatedHole,
  PcbRenderLayer,
  PcbTrace,
  PcbVia,
} from "circuit-json"
import type { Matrix } from "transformation-matrix"
import type { CanvasContext, PcbColorMap } from "../../types"
import { createDrawingLayerContext } from "../../layers/create-drawing-layer-context"
import { mergeDrawingLayer } from "../../layers/merge-drawing-layer"
import { appendPcbCopperPourPath } from "../pcb-copper-pour"
import { drawPcbTrace } from "./pcb-trace"

export function drawPcbTracesClippedToCopperPours(params: {
  ctx: CanvasContext
  traces: PcbTrace[]
  copperPours: PcbCopperPour[]
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
  vias: PcbVia[]
  platedHoles: PcbPlatedHole[]
  renderLayers?: PcbRenderLayer[]
}): void {
  const {
    ctx,
    traces,
    copperPours,
    realToCanvasMat,
    colorMap,
    vias,
    platedHoles,
    renderLayers,
  } = params

  for (const layer of getTraceLayers(traces, renderLayers)) {
    const layerCopperPours = copperPours.filter((pour) => pour.layer === layer)

    if (layerCopperPours.length === 0) {
      drawTracesOnLayer({
        ctx,
        traces,
        layer,
        realToCanvasMat,
        colorMap,
        vias,
        platedHoles,
      })
      continue
    }

    const traceLayerCtx = createDrawingLayerContext(
      ctx,
      ctx.canvas.width,
      ctx.canvas.height,
    )

    if (traceLayerCtx) {
      drawTracesOnLayer({
        ctx: traceLayerCtx,
        traces,
        layer,
        realToCanvasMat,
        colorMap,
        vias,
        platedHoles,
      })
      eraseCopperPoursFromTraceLayer({
        ctx: traceLayerCtx,
        copperPours: layerCopperPours,
        realToCanvasMat,
      })
      if (mergeDrawingLayer(ctx, traceLayerCtx)) continue
    }

    // A custom canvas implementation may not support drawing layers. Keep a
    // clip-based fallback so trace rendering remains available in that case.
    ctx.save()
    clipToOutsideCopperPours({
      ctx,
      copperPours: layerCopperPours,
      realToCanvasMat,
    })
    drawTracesOnLayer({
      ctx,
      traces,
      layer,
      realToCanvasMat,
      colorMap,
      vias,
      platedHoles,
    })
    ctx.restore()
  }
}

function drawTracesOnLayer(params: {
  ctx: CanvasContext
  traces: PcbTrace[]
  layer: LayerRef
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
  vias: PcbVia[]
  platedHoles: PcbPlatedHole[]
}): void {
  const { ctx, traces, layer, realToCanvasMat, colorMap, vias, platedHoles } =
    params

  for (const trace of traces) {
    drawPcbTrace({
      ctx,
      trace,
      realToCanvasMat,
      colorMap,
      vias,
      platedHoles,
      layer,
    })
  }
}

function eraseCopperPoursFromTraceLayer(params: {
  ctx: CanvasContext
  copperPours: PcbCopperPour[]
  realToCanvasMat: Matrix
}): void {
  const { ctx, copperPours, realToCanvasMat } = params
  if (copperPours.length === 0) return

  ctx.save()
  ctx.globalCompositeOperation = "destination-out"
  ctx.fillStyle = "#000"

  for (const pour of copperPours) {
    ctx.beginPath()
    appendPcbCopperPourPath({ ctx, pour, realToCanvasMat })
    ctx.fill(pour.shape === "brep" ? "evenodd" : "nonzero")
  }

  ctx.restore()
}

function getTraceLayers(
  traces: PcbTrace[],
  renderLayers?: PcbRenderLayer[],
): LayerRef[] {
  const layers = new Set<LayerRef>()
  for (const trace of traces) {
    for (const point of trace.route ?? []) {
      if (point.route_type !== "wire" || !point.layer) continue
      if (
        renderLayers?.length &&
        !renderLayers.includes(`${point.layer}_copper` as PcbRenderLayer)
      ) {
        continue
      }
      layers.add(point.layer)
    }
  }
  return [...layers]
}

/** Clips to the complement of the finalized copper regions on this layer. */
function clipToOutsideCopperPours(params: {
  ctx: CanvasContext
  copperPours: PcbCopperPour[]
  realToCanvasMat: Matrix
}): void {
  const { ctx, copperPours, realToCanvasMat } = params
  if (copperPours.length === 0) return

  // Finalized pour regions on one layer are non-overlapping solids. Appending
  // all of them to one even-odd path keeps this fallback to one layer clip.
  ctx.beginPath()
  ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height)
  for (const pour of copperPours) {
    appendPcbCopperPourPath({ ctx, pour, realToCanvasMat })
  }
  ctx.clip("evenodd")
}
