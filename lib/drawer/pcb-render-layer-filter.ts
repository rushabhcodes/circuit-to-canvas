import type { AnyCircuitElement } from "circuit-json"
import type { DrawElementsOptions } from "./CircuitToCanvasDrawer"
import { getElementRenderLayers } from "@tscircuit/circuit-json-util"

/**
 * Gets the render layer(s) for an element based on its type and layer property
 */

/**
 * Checks if an element should be drawn based on layer options
 */
export function shouldDrawElement(
  element: AnyCircuitElement,
  options: DrawElementsOptions,
): boolean {
  // If no layers specified, draw all elements
  if (!options.layers || options.layers.length === 0) {
    return true
  }

  // Older circuit-json-util versions do not classify silkscreen graphics.
  if (element.type === "pcb_silkscreen_graphic") {
    return options.layers.some(
      (layer) => layer === `${element.layer}_silkscreen`,
    )
  }

  const elementLayers = getElementRenderLayers(element)

  // If element has no layer info (board, holes, etc.), always draw
  if (elementLayers.length === 0) {
    return true
  }

  // Check if any of the element's layers match the requested layers
  return elementLayers.some((layer) => options.layers!.includes(layer))
}
