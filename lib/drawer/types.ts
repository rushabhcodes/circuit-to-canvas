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
  fill(): void
  stroke(): void
  rect(x: number, y: number, w: number, h: number): void
  lineTo(x: number, y: number): void
  moveTo(x: number, y: number): void
  save(): void
  restore(): void
  translate(x: number, y: number): void
  rotate(angle: number): void
  scale(x: number, y: number): void
  globalCompositeOperation?: string
  fillStyle: string | CanvasGradient | CanvasPattern
  strokeStyle: string | CanvasGradient | CanvasPattern
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

export type CopperLayerName =
  | "top"
  | "bottom"
  | "inner1"
  | "inner2"
  | "inner3"
  | "inner4"
  | "inner5"
  | "inner6"

export type CopperColorMap = Record<CopperLayerName, string> & {
  [layer: string]: string
}

export interface PcbColorMap {
  copper: CopperColorMap
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
  courtyard: string
  component: string
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
    bottom: "rgb(77, 127, 196)",
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
  courtyard: "#FF00FF",
  component: "#00FFFF",
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
