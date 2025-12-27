import type { PcbCopperPour, PcbCopperPourBRep } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import { applyToPoint } from "transformation-matrix"
import type { PcbColorMap, CanvasContext } from "../types"
import { drawPolygon } from "../shapes/polygon"
import { drawPath } from "../shapes/path"

export interface DrawPcbCopperPourParams {
  ctx: CanvasContext
  pour: PcbCopperPour
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
}

interface BrepVertex {
  x: number
  y: number
  z?: number
}

interface BrepLoopEdge {
  start: BrepVertex
  end: BrepVertex
  curve?: "line" | "arc" | "circle" | "bezier"
  radius?: number
  controlPoints?: BrepVertex[]
}

interface BrepLoop {
  edges: BrepLoopEdge[]
}

export interface DrawPcbCopperPourBRepParams {
  ctx: CanvasContext
  element: PcbCopperPourBRep
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
}

function layerToColor(layer: string, colorMap: PcbColorMap): string {
  return (
    colorMap.copper[layer as keyof typeof colorMap.copper] ??
    colorMap.copper.top
  )
}

export function drawPcbCopperPour(params: DrawPcbCopperPourParams): void {
  const { ctx, pour, realToCanvasMat, colorMap } = params

  const color = layerToColor(pour.layer, colorMap)

  // Save context to apply opacity
  ctx.save()

  if (pour.shape === "rect") {
    // Draw the copper pour rectangle with 50% opacity
    const [cx, cy] = applyToPoint(realToCanvasMat, [
      pour.center.x,
      pour.center.y,
    ])
    const scaledWidth = pour.width * Math.abs(realToCanvasMat.a)
    const scaledHeight = pour.height * Math.abs(realToCanvasMat.a)

    ctx.translate(cx, cy)

    if (pour.rotation) {
      ctx.rotate(-pour.rotation * (Math.PI / 180))
    }

    ctx.beginPath()
    ctx.rect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight)
    ctx.fillStyle = color
    ;(ctx as any).globalAlpha = 0.5
    ctx.fill()
    ctx.restore()
    return
  }

  if (pour.shape === "polygon") {
    if (pour.points && pour.points.length >= 3) {
      const canvasPoints = pour.points.map((p: { x: number; y: number }) =>
        applyToPoint(realToCanvasMat, [p.x, p.y]),
      )

      const firstPoint = canvasPoints[0]
      if (!firstPoint) {
        ctx.restore()
        return
      }

      ctx.beginPath()
      const [firstX, firstY] = firstPoint
      ctx.moveTo(firstX, firstY)

      for (let i = 1; i < canvasPoints.length; i++) {
        const point = canvasPoints[i]
        if (!point) continue
        const [x, y] = point
        ctx.lineTo(x, y)
      }

      ctx.closePath()
      ctx.fillStyle = color
      ;(ctx as any).globalAlpha = 0.5
      ctx.fill()
    }
    ctx.restore()
    return
  }

  ctx.restore()
}

function projectLoopTo2D(loop: BrepLoop): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = []

  for (const edge of loop.edges) {
    if (edge.curve === "line" || !edge.curve) {
      points.push({ x: edge.start.x, y: edge.start.y })
      if (edge.start.x !== edge.end.x || edge.start.y !== edge.end.y) {
        points.push({ x: edge.end.x, y: edge.end.y })
      }
    } else if (edge.curve === "arc" && edge.radius) {
      const centerX = edge.start.x
      const centerY = edge.start.y
      const endAngle = Math.atan2(edge.end.y - centerY, edge.end.x - centerX)
      const startAngle = 0

      const segments = 20
      for (let i = 0; i <= segments; i++) {
        const angle = startAngle + (endAngle - startAngle) * (i / segments)
        points.push({
          x: centerX + Math.cos(angle) * edge.radius,
          y: centerY + Math.sin(angle) * edge.radius,
        })
      }
    } else if (
      edge.curve === "bezier" &&
      edge.controlPoints &&
      edge.controlPoints.length >= 2
    ) {
      const points2D = bezierToPoints(
        { x: edge.start.x, y: edge.start.y },
        edge.controlPoints.slice(0, 2),
        { x: edge.end.x, y: edge.end.y },
        20,
      )
      points.push(...points2D)
    } else {
      points.push({ x: edge.start.x, y: edge.start.y })
      points.push({ x: edge.end.x, y: edge.end.y })
    }
  }

  return points
}

function bezierToPoints(
  start: { x: number; y: number },
  controlPoints: { x: number; y: number }[],
  end: { x: number; y: number },
  segments: number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = []

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    let x: number
    let y: number

    if (controlPoints.length === 1 && controlPoints[0]) {
      const cp = controlPoints[0]
      x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * cp.x + t * t * end.x
      y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * cp.y + t * t * end.y
    } else if (
      controlPoints.length >= 2 &&
      controlPoints[0] &&
      controlPoints[1]
    ) {
      const cp1 = controlPoints[0]
      const cp2 = controlPoints[1]
      x =
        (1 - t) ** 3 * start.x +
        3 * (1 - t) ** 2 * t * cp1.x +
        3 * (1 - t) * t ** 2 * cp2.x +
        t ** 3 * end.x
      y =
        (1 - t) ** 3 * start.y +
        3 * (1 - t) ** 2 * t * cp1.y +
        3 * (1 - t) * t ** 2 * cp2.y +
        t ** 3 * end.y
    } else {
      x = start.x
      y = start.y
    }

    points.push({ x, y })
  }

  return points
}

function getDefaultFillColor(layer: string, colorMap: PcbColorMap): string {
  if (layer.startsWith("top") || layer === "top") {
    return colorMap.copper.top
  }
  if (layer.startsWith("bottom") || layer === "bottom") {
    return colorMap.copper.bottom
  }
  if (layer === "drill") {
    return colorMap.drill
  }
  if (layer === "silkscreen_top") {
    return colorMap.silkscreen.top
  }
  if (layer === "silkscreen_bottom") {
    return colorMap.silkscreen.bottom
  }
  return colorMap.copper.top
}

export function drawPcbCopperPourBRep(
  params: DrawPcbCopperPourBRepParams,
): void {
  const { ctx, element, realToCanvasMat, colorMap } = params

  ctx.save()

  // Map BRep structure to expected geometry format
  const geometry = {
    faces: [
      {
        outer: {
          edges: element.brep_shape.outer_ring.vertices.map((v, i) => {
            const nextV =
              element.brep_shape.outer_ring.vertices[
                (i + 1) % element.brep_shape.outer_ring.vertices.length
              ]
            return {
              start: { x: v.x, y: v.y } as BrepVertex,
              end: { x: nextV!.x, y: nextV!.y } as BrepVertex,
              curve: "line" as const,
            }
          }),
        },
        holes: element.brep_shape.inner_rings?.map((ring) => ({
          edges: ring.vertices.map((v, i) => {
            const nextV = ring.vertices[(i + 1) % ring.vertices.length]
            return {
              start: { x: v.x, y: v.y } as BrepVertex,
              end: { x: nextV!.x, y: nextV!.y } as BrepVertex,
              curve: "line" as const,
            }
          }),
        })),
      },
    ],
  }

  // Default style for copper pour
  const opacity = 0.5
  const fillColor = getDefaultFillColor(element.layer, colorMap)
  const strokeWidth = 0.1

  ctx.globalAlpha = opacity

  for (const face of geometry.faces) {
    const outerPolygon = projectLoopTo2D(face.outer)

    if (outerPolygon.length < 3) continue

    drawPolygon({
      ctx,
      points: outerPolygon,
      fill: fillColor,
      realToCanvasMat,
    })

    if (face.holes) {
      ctx.globalCompositeOperation = "destination-out"
      for (const hole of face.holes) {
        const holePolygon = projectLoopTo2D(hole)
        if (holePolygon.length >= 3) {
          drawPolygon({
            ctx,
            points: holePolygon,
            fill: "black",
            realToCanvasMat,
          })
        }
      }
      ctx.globalCompositeOperation = "source-over"
    }

    drawPath({
      ctx,
      points: outerPolygon,
      stroke: fillColor,
      strokeWidth: strokeWidth,
      realToCanvasMat,
      closePath: true,
    })
  }

  ctx.restore()
}
