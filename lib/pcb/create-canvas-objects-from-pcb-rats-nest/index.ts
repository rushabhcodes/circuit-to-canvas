import type { AnyCircuitElement } from "circuit-json"
import { su } from "@tscircuit/circuit-json-util"
import type { ConnectivityMap } from "circuit-json-to-connectivity-map"
import type { Matrix } from "transformation-matrix"
import type { CanvasContext, PcbColorMap } from "../../drawer/types"

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
  const connectedIds = connectivity.getIdsConnectedToNet(netId)
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

  ctx.save()

  // Set line style for rats nest (dotted lines)
  ctx.strokeStyle = colorMap.silkscreen.top
  ctx.lineWidth = 0.1 // Thin lines
  ctx.setLineDash([1, 1]) // Dotted pattern

  // Apply transform to coordinates
  const applyTransform = (x: number, y: number) => {
    return {
      x: transform.a * x + transform.c * y + transform.e,
      y: transform.b * x + transform.d * y + transform.f,
    }
  }

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

    // Draw lines from each point to its nearest neighbor
    for (const sourcePos of positions) {
      const nearestPos = findNearestPointInNet(
        sourcePos,
        netId,
        connectivity,
        circuitJson,
      )
      if (nearestPos) {
        const tSource = applyTransform(sourcePos.x, sourcePos.y)
        const tNearest = applyTransform(nearestPos.x, nearestPos.y)
        ctx.beginPath()
        ctx.moveTo(tSource.x, tSource.y)
        ctx.lineTo(tNearest.x, tNearest.y)
        ctx.stroke()
      }
    }
  }

  ctx.restore()
}
