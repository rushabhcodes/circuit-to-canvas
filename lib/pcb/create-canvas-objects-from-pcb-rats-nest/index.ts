import type { AnyCircuitElement } from "circuit-json"
import { su } from "@tscircuit/circuit-json-util"
import type { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type { Matrix } from "transformation-matrix"
import type { CanvasContext, PcbColorMap } from "../../drawer/types"
import { drawLine } from "../../drawer/shapes/line"

// Dash pattern for rats nest lines: [dash length, gap length] in canvas units
// Using [1, 1] creates a dotted pattern where dashes and gaps are equal length
// This provides clear visual distinction for unrouted connections
const RATS_NEST_LINE_DASH: number[] = [1, 1]

// Line width for rats nest connections in real-world units (millimeters)
// Using 0.1mm provides thin, subtle lines that are visible but don't overpower
// the main PCB elements. The drawLine utility scales this by the transform matrix.
const RATS_NEST_LINE_WIDTH = 0.1

interface Position {
  x: number
  y: number
}

export const getElementPosition = (
  id: string,
  circuitJson: AnyCircuitElement[],
): Position | null => {
  // Try to find the element as a pcb_smtpad
  const pcbSmtpad = su(circuitJson).pcb_smtpad.get(id)
  if (pcbSmtpad && "x" in pcbSmtpad && "y" in pcbSmtpad) {
    return { x: pcbSmtpad.x, y: pcbSmtpad.y }
  }

  // Try to find the element as a pcb_plated_hole
  const pcbPlatedHole = su(circuitJson).pcb_plated_hole.get(id)
  if (pcbPlatedHole && "x" in pcbPlatedHole && "y" in pcbPlatedHole) {
    return { x: pcbPlatedHole.x, y: pcbPlatedHole.y }
  }

  // Try to find the element as a pcb_via
  const pcbVia = su(circuitJson).pcb_via.get(id)
  if (pcbVia && "x" in pcbVia && "y" in pcbVia) {
    return { x: pcbVia.x, y: pcbVia.y }
  }

  // If none found, return null
  return null
}

export const findNearestPointInNet = (
  sourcePoint: { x: number; y: number },
  netId: string,
  connectivity: ConnectivityMap,
  circuitJson: AnyCircuitElement[],
): { x: number; y: number } | null => {
  const connectedIds = connectivity.netMap[netId]
  if (!connectedIds) return null
  let nearestPoint: { x: number; y: number } | null = null
  let minDistance = Infinity

  for (const id of connectedIds) {
    const pos = getElementPosition(id, circuitJson)
    if (pos) {
      const dx = sourcePoint.x - pos.x
      const dy = sourcePoint.y - pos.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance > 0 && distance < minDistance) {
        minDistance = distance
        nearestPoint = pos
      }
    }
  }

  return nearestPoint
}

export const drawPcbRatsNest = ({
  ctx,
  circuitJson,
  connectivity,
  transform,
  colorMap,
}: {
  ctx: CanvasContext
  circuitJson: AnyCircuitElement[]
  connectivity: ConnectivityMap
  transform: Matrix
  colorMap: PcbColorMap
}) => {
  const netIds = Object.keys(connectivity.netMap)

  for (const netId of netIds) {
    const connectedIds = connectivity.netMap[netId]
    if (!connectedIds) continue
    const positions: Position[] = []

    // Collect all positions for elements in this net
    for (const id of connectedIds) {
      const pos = getElementPosition(id, circuitJson)
      if (pos) {
        positions.push(pos)
      }
    }

    // Track drawn connections to avoid duplicates
    const drawnConnections = new Set<string>()

    // Draw lines from each point to its nearest neighbor
    for (const sourcePos of positions) {
      const nearestPos = findNearestPointInNet(
        sourcePos,
        netId,
        connectivity,
        circuitJson,
      )
      if (nearestPos) {
        // Create a unique key for the connection (sorted by coordinates)
        const key = [
          `${sourcePos.x},${sourcePos.y}`,
          `${nearestPos.x},${nearestPos.y}`,
        ]
          .sort()
          .join("-")

        if (!drawnConnections.has(key)) {
          drawnConnections.add(key)
          drawLine({
            ctx,
            start: sourcePos,
            end: nearestPos,
            strokeWidth: RATS_NEST_LINE_WIDTH,
            stroke: colorMap.silkscreen.top,
            transform,
            lineCap: "round",
            lineDash: RATS_NEST_LINE_DASH,
          })
        }
      }
    }
  }
}
