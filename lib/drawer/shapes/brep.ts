import type { Ring } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import { applyToPoint } from "transformation-matrix"
import type { CanvasContext } from "../types"

export interface BrepShape {
  outer_ring: Ring
  inner_rings?: Ring[]
}

interface ComputeArcFromBulgeParams {
  startX: number
  startY: number
  endX: number
  endY: number
  bulge: number
}

function computeArcFromBulge({
  startX,
  startY,
  endX,
  endY,
  bulge,
}: ComputeArcFromBulgeParams): {
  centerX: number
  centerY: number
  radius: number
} | null {
  if (Math.abs(bulge) < 1e-10) return null

  const chordX = endX - startX
  const chordY = endY - startY
  const chordLength = Math.hypot(chordX, chordY)
  if (chordLength < 1e-10) return null

  const sagitta = Math.abs(bulge) * (chordLength / 2)
  const halfChord = chordLength / 2
  const radius = (sagitta * sagitta + halfChord * halfChord) / (2 * sagitta)
  const distToCenter = radius - sagitta
  const midX = (startX + endX) / 2
  const midY = (startY + endY) / 2
  const perpX = -chordY / chordLength
  const perpY = chordX / chordLength
  const sign = bulge > 0 ? -1 : 1

  return {
    centerX: midX + sign * perpX * distToCenter,
    centerY: midY + sign * perpY * distToCenter,
    radius,
  }
}

interface AddArcFromBulgeToPathParams {
  ctx: CanvasContext
  realStartX: number
  realStartY: number
  realEndX: number
  realEndY: number
  bulge: number
  realToCanvasMat: Matrix
}

function addArcFromBulgeToPath({
  ctx,
  realStartX,
  realStartY,
  realEndX,
  realEndY,
  bulge,
  realToCanvasMat,
}: AddArcFromBulgeToPathParams): void {
  if (Math.abs(bulge) < 1e-10) {
    const [endX, endY] = applyToPoint(realToCanvasMat, [realEndX, realEndY])
    ctx.lineTo(endX, endY)
    return
  }

  const arc = computeArcFromBulge({
    startX: realStartX,
    startY: realStartY,
    endX: realEndX,
    endY: realEndY,
    bulge,
  })
  if (!arc) {
    const [endX, endY] = applyToPoint(realToCanvasMat, [realEndX, realEndY])
    ctx.lineTo(endX, endY)
    return
  }

  const [canvasStartX, canvasStartY] = applyToPoint(realToCanvasMat, [
    realStartX,
    realStartY,
  ])
  const [canvasEndX, canvasEndY] = applyToPoint(realToCanvasMat, [
    realEndX,
    realEndY,
  ])
  const [canvasCenterX, canvasCenterY] = applyToPoint(realToCanvasMat, [
    arc.centerX,
    arc.centerY,
  ])
  const canvasRadius = Math.hypot(
    canvasStartX - canvasCenterX,
    canvasStartY - canvasCenterY,
  )
  const startAngle = Math.atan2(
    canvasStartY - canvasCenterY,
    canvasStartX - canvasCenterX,
  )
  const endAngle = Math.atan2(
    canvasEndY - canvasCenterY,
    canvasEndX - canvasCenterX,
  )
  const determinant =
    realToCanvasMat.a * realToCanvasMat.d -
    realToCanvasMat.b * realToCanvasMat.c
  const isFlipped = determinant < 0
  const counterclockwise = bulge > 0 ? !isFlipped : isFlipped

  ctx.arc(
    canvasCenterX,
    canvasCenterY,
    canvasRadius,
    startAngle,
    endAngle,
    counterclockwise,
  )
}

export interface AddBrepRingToPathParams {
  ctx: CanvasContext
  ring: Ring
  realToCanvasMat: Matrix
}

export function addBrepRingToPath({
  ctx,
  ring,
  realToCanvasMat,
}: AddBrepRingToPathParams): void {
  if (ring.vertices.length < 2) return

  if (ring.vertices.length === 2) {
    const [v0, v1] = ring.vertices
    if (
      v0 &&
      v1 &&
      Math.abs((v0.bulge ?? 0) - 1) < 1e-10 &&
      Math.abs((v1.bulge ?? 0) - 1) < 1e-10
    ) {
      const [x0, y0] = applyToPoint(realToCanvasMat, [v0.x, v0.y])
      ctx.moveTo(x0, y0)
      addArcFromBulgeToPath({
        ctx,
        realStartX: v0.x,
        realStartY: v0.y,
        realEndX: v1.x,
        realEndY: v1.y,
        bulge: 1,
        realToCanvasMat,
      })
      addArcFromBulgeToPath({
        ctx,
        realStartX: v1.x,
        realStartY: v1.y,
        realEndX: v0.x,
        realEndY: v0.y,
        bulge: 1,
        realToCanvasMat,
      })
      return
    }
  }

  const firstVertex = ring.vertices[0]
  if (!firstVertex) return
  const [firstX, firstY] = applyToPoint(realToCanvasMat, [
    firstVertex.x,
    firstVertex.y,
  ])
  ctx.moveTo(firstX, firstY)

  for (let i = 0; i < ring.vertices.length; i++) {
    const currentVertex = ring.vertices[i]
    const nextVertex = ring.vertices[(i + 1) % ring.vertices.length]
    if (!currentVertex || !nextVertex) continue

    addArcFromBulgeToPath({
      ctx,
      realStartX: currentVertex.x,
      realStartY: currentVertex.y,
      realEndX: nextVertex.x,
      realEndY: nextVertex.y,
      bulge: currentVertex.bulge ?? 0,
      realToCanvasMat,
    })
  }
}

export interface AddBrepShapeToPathParams {
  ctx: CanvasContext
  shape: BrepShape
  realToCanvasMat: Matrix
}

export function addBrepShapeToPath({
  ctx,
  shape,
  realToCanvasMat,
}: AddBrepShapeToPathParams): void {
  addBrepRingToPath({ ctx, ring: shape.outer_ring, realToCanvasMat })
  for (const innerRing of shape.inner_rings ?? []) {
    addBrepRingToPath({ ctx, ring: innerRing, realToCanvasMat })
  }
}
