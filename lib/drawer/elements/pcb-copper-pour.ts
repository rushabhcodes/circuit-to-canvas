import type { PcbCopperPour } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import { applyToPoint } from "transformation-matrix"
import type { PcbColorMap, CanvasContext } from "../types"
import type { Ring } from "circuit-json"

export interface DrawPcbCopperPourParams {
  ctx: CanvasContext
  pour: PcbCopperPour
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
}

function layerToColor(layer: string, colorMap: PcbColorMap): string {
  return (
    colorMap.copper[layer as keyof typeof colorMap.copper] ??
    colorMap.copper.top
  )
}

/**
 * Compute arc center and radius from two points and a bulge value.
 * Bulge is the tangent of 1/4 of the included angle.
 * - bulge = 0: straight line
 * - bulge = 1: semicircle (180 degrees)
 * - bulge > 0: arc bulges to the left of the direction from start to end
 * - bulge < 0: arc bulges to the right
 */
function computeArcFromBulge(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  bulge: number,
): { centerX: number; centerY: number; radius: number } | null {
  if (Math.abs(bulge) < 1e-10) {
    return null
  }

  // Calculate chord vector and length
  const chordX = endX - startX
  const chordY = endY - startY
  const chordLength = Math.hypot(chordX, chordY)

  if (chordLength < 1e-10) {
    return null
  }

  // The sagitta (bulge height) is: s = bulge * (chord_length / 2)
  // This is because bulge = tan(theta/4) and s = r - r*cos(theta/2)
  // After simplification: s = (chord/2) * tan(theta/4) = (chord/2) * bulge
  const sagitta = Math.abs(bulge) * (chordLength / 2)

  // Calculate radius from sagitta and chord:
  // From geometry: r = (s^2 + (chord/2)^2) / (2*s)
  const halfChord = chordLength / 2
  const radius = (sagitta * sagitta + halfChord * halfChord) / (2 * sagitta)

  // Distance from chord midpoint to center
  const distToCenter = radius - sagitta

  // Midpoint of the chord
  const midX = (startX + endX) / 2
  const midY = (startY + endY) / 2

  // Unit vector perpendicular to chord
  // "Left" of the direction from start to end (in standard Y-up coords)
  const perpX = -chordY / chordLength
  const perpY = chordX / chordLength

  // For positive bulge, arc bulges left, so center is to the RIGHT of chord direction
  // For negative bulge, arc bulges right, so center is to the LEFT of chord direction
  const sign = bulge > 0 ? -1 : 1
  const centerX = midX + sign * perpX * distToCenter
  const centerY = midY + sign * perpY * distToCenter

  return { centerX, centerY, radius }
}

/**
 * Draws an arc between two points given a bulge value.
 * Coordinates are in canvas space, but we need the original real-space points
 * to correctly compute the arc direction.
 */
function drawArcFromBulge(
  ctx: CanvasContext,
  realStartX: number,
  realStartY: number,
  realEndX: number,
  realEndY: number,
  bulge: number,
  realToCanvasMat: Matrix,
): void {
  if (Math.abs(bulge) < 1e-10) {
    const [endX, endY] = applyToPoint(realToCanvasMat, [realEndX, realEndY])
    ctx.lineTo(endX, endY)
    return
  }

  // Compute arc in real coordinates
  const arc = computeArcFromBulge(
    realStartX,
    realStartY,
    realEndX,
    realEndY,
    bulge,
  )

  if (!arc) {
    const [endX, endY] = applyToPoint(realToCanvasMat, [realEndX, realEndY])
    ctx.lineTo(endX, endY)
    return
  }

  // Transform all points to canvas coordinates
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

  // Calculate radius in canvas space (may be scaled)
  const canvasRadius = Math.hypot(
    canvasStartX - canvasCenterX,
    canvasStartY - canvasCenterY,
  )

  // Calculate start and end angles in canvas space
  const startAngle = Math.atan2(
    canvasStartY - canvasCenterY,
    canvasStartX - canvasCenterX,
  )
  const endAngle = Math.atan2(
    canvasEndY - canvasCenterY,
    canvasEndX - canvasCenterX,
  )

  // Determine arc direction
  // In real coords: positive bulge = counterclockwise (left-hand rule)
  // The transformation may flip Y, which reverses the apparent direction
  // Check if transformation flips by looking at the determinant (a*d - b*c)
  const det =
    realToCanvasMat.a * realToCanvasMat.d -
    realToCanvasMat.b * realToCanvasMat.c
  const isFlipped = det < 0

  // Positive bulge in real coords = counterclockwise in real coords
  // If flipped, counterclockwise becomes clockwise in canvas coords
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

function drawRing(
  ctx: CanvasContext,
  ring: Ring,
  realToCanvasMat: Matrix,
): void {
  if (ring.vertices.length < 2) return

  // Special case: a circle defined by 2 vertices with bulge=1 each
  if (ring.vertices.length === 2) {
    const v0 = ring.vertices[0]
    const v1 = ring.vertices[1]
    if (
      v0 &&
      v1 &&
      Math.abs((v0.bulge ?? 0) - 1) < 1e-10 &&
      Math.abs((v1.bulge ?? 0) - 1) < 1e-10
    ) {
      // This is a full circle - draw two semicircles
      const [x0, y0] = applyToPoint(realToCanvasMat, [v0.x, v0.y])

      ctx.moveTo(x0, y0)
      drawArcFromBulge(ctx, v0.x, v0.y, v1.x, v1.y, 1, realToCanvasMat)
      drawArcFromBulge(ctx, v1.x, v1.y, v0.x, v0.y, 1, realToCanvasMat)
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
    const nextIndex = (i + 1) % ring.vertices.length
    const nextVertex = ring.vertices[nextIndex]

    if (!currentVertex || !nextVertex) continue

    const bulge = currentVertex.bulge ?? 0

    if (Math.abs(bulge) < 1e-10) {
      // No bulge, draw straight line
      const [nextX, nextY] = applyToPoint(realToCanvasMat, [
        nextVertex.x,
        nextVertex.y,
      ])
      ctx.lineTo(nextX, nextY)
    } else {
      // Draw arc based on bulge value (pass real coordinates)
      drawArcFromBulge(
        ctx,
        currentVertex.x,
        currentVertex.y,
        nextVertex.x,
        nextVertex.y,
        bulge,
        realToCanvasMat,
      )
    }
  }
}

export { drawRing as drawBrepRing }

/**
 * Appends a copper pour's exact geometry to the current canvas path without
 * beginning, filling, or clipping it. This keeps pour painting and trace
 * clipping on the same geometry implementation.
 */
export function appendPcbCopperPourPath(params: {
  ctx: CanvasContext
  pour: PcbCopperPour
  realToCanvasMat: Matrix
}): void {
  const { ctx, pour, realToCanvasMat } = params

  if (pour.shape === "rect") {
    const halfWidth = pour.width / 2
    const halfHeight = pour.height / 2
    const rotation = ((pour.rotation ?? 0) * Math.PI) / 180
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)
    const canvasPoints = [
      { x: -halfWidth, y: -halfHeight },
      { x: halfWidth, y: -halfHeight },
      { x: halfWidth, y: halfHeight },
      { x: -halfWidth, y: halfHeight },
    ].map((point) =>
      applyToPoint(realToCanvasMat, [
        pour.center.x + point.x * cos - point.y * sin,
        pour.center.y + point.x * sin + point.y * cos,
      ]),
    )
    const firstPoint = canvasPoints[0]
    if (!firstPoint) return

    ctx.moveTo(firstPoint[0], firstPoint[1])
    for (let index = 1; index < canvasPoints.length; index++) {
      const point = canvasPoints[index]
      if (point) ctx.lineTo(point[0], point[1])
    }
    ctx.closePath()
    return
  }

  if (pour.shape === "polygon") {
    const firstPoint = pour.points[0]
    if (!firstPoint) return
    const [firstX, firstY] = applyToPoint(realToCanvasMat, [
      firstPoint.x,
      firstPoint.y,
    ])
    ctx.moveTo(firstX, firstY)

    for (let index = 1; index < pour.points.length; index++) {
      const point = pour.points[index]
      if (!point) continue
      const [x, y] = applyToPoint(realToCanvasMat, [point.x, point.y])
      ctx.lineTo(x, y)
    }
    ctx.closePath()
    return
  }

  if (pour.shape !== "brep") return

  drawRing(ctx, pour.brep_shape.outer_ring, realToCanvasMat)
  for (const innerRing of pour.brep_shape.inner_rings ?? []) {
    drawRing(ctx, innerRing, realToCanvasMat)
  }
}

export function drawPcbCopperPour(params: DrawPcbCopperPourParams): void {
  const { ctx, pour, realToCanvasMat, colorMap } = params

  const color = layerToColor(pour.layer, colorMap)
  const opacity = 0.5

  // Save context to apply opacity
  ctx.save()
  ctx.globalAlpha = opacity

  ctx.beginPath()
  appendPcbCopperPourPath({ ctx, pour, realToCanvasMat })
  ctx.fillStyle = color
  ctx.fill(pour.shape === "brep" ? "evenodd" : "nonzero")
  ctx.restore()
}
