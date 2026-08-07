import type { LayerRef } from "circuit-json"
import type { Matrix } from "transformation-matrix"

/**
 * Canvas context type that works with both browser and node-canvas.
 * Uses a subset of CanvasRenderingContext2D methods that are common to both.
 */
export interface CanvasContext {
  beginPath(): void
  closePath(): void
  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise?: boolean,
  ): void
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void
  ellipse(
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation: number,
    startAngle: number,
    endAngle: number,
  ): void
  fill(fillRule?: "nonzero" | "evenodd"): void
  stroke(): void
  rect(x: number, y: number, w: number, h: number): void
  lineTo(x: number, y: number): void
  moveTo(x: number, y: number): void
  save(): void
  restore(): void
  clip(fillRule?: "nonzero" | "evenodd"): void
  translate(x: number, y: number): void
  rotate(angle: number): void
  scale(x: number, y: number): void
  globalCompositeOperation?: string
  fillStyle: string | CanvasGradient | CanvasPattern
  strokeStyle: string | CanvasGradient | CanvasPattern
  globalAlpha: number
  lineWidth: number
  lineCap: "butt" | "round" | "square"
  lineJoin: "bevel" | "round" | "miter"
  setLineDash(segments: number[]): void
  canvas: { width: number; height: number }
  fillText(text: string, x: number, y: number): void
  fillRect(x: number, y: number, width: number, height: number): void
  measureText?: (text: string) => {
    width: number
    actualBoundingBoxAscent?: number
    actualBoundingBoxDescent?: number
  }
  font: string
  textAlign: "start" | "end" | "left" | "right" | "center"
}

export type CopperLayerName = LayerRef

export type CopperColorMap = Record<CopperLayerName, string> & {
  [layer: string]: string
}

export interface PcbColorMap {
  copper: CopperColorMap
  copperPour: {
    top: string
    bottom: string
  }
  drill: string
  silkscreen: {
    top: string
    bottom: string
  }
  boardOutline: string
  soldermask: {
    top: string
    bottom: string
  }
  soldermaskWithCopperUnderneath: {
    top: string
    bottom: string
  }
  soldermaskOverCopper: {
    top: string
    bottom: string
  }
  substrate: string
  courtyard: {
    top: string
    bottom: string
  }
  keepout: {
    top: string
    bottom: string
  }
  fabricationNote: string
}

export const DEFAULT_PCB_COLOR_MAP: PcbColorMap = {
  copper: {
    top: "rgb(200, 52, 52)",
    inner1: "rgb(255, 140, 0)",
    inner2: "rgb(255, 215, 0)",
    inner3: "rgb(50, 205, 50)",
    inner4: "rgb(64, 224, 208)",
    inner5: "rgb(138, 43, 226)",
    inner6: "rgb(255, 105, 180)",
    inner7: "rgb(232, 178, 167)",
    inner8: "rgb(242, 237, 161)",
    bottom: "rgb(77, 127, 196)",
  },
  copperPour: {
    top: "rgb(230, 95, 95)",
    bottom: "rgb(122, 162, 222)",
  },
  soldermaskWithCopperUnderneath: {
    top: "rgb(18, 82, 50)",
    bottom: "rgb(77, 127, 196)",
  },
  soldermask: {
    top: "rgb(12, 55, 33)",
    bottom: "rgb(12, 55, 33)",
  },
  soldermaskOverCopper: {
    top: "rgb(52, 135, 73)",
    bottom: "rgb(52, 135, 73)",
  },
  substrate: "rgb(201, 162, 110)",
  drill: "#FF26E2",
  silkscreen: {
    top: "#f2eda1",
    bottom: "#5da9e9",
  },
  boardOutline: "rgba(255, 255, 255, 0.5)",
  courtyard: {
    top: "#FF00FF",
    bottom: "rgb(38, 233, 255)",
  },
  keepout: {
    top: "#FF6B6B",
    bottom: "#5da9e9",
  },
  fabricationNote: "rgba(255, 255, 255, 0.5)",
}

export interface DrawerConfig {
  colorOverrides?: Partial<PcbColorMap>
}

export interface CameraBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface DrawContext {
  ctx: CanvasRenderingContext2D
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
}
