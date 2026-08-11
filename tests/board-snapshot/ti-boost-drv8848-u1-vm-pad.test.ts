import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getStackedPngSvgComparison } from "../fixtures/getStackedPngSvgComparison"
import tiBoostDrv8848Pcb from "./ti-boost-drv8848-u1-vm-pad.json"

// PCB-only elements from https://tscircuit.com/MustafaMulla29/ti-boost-drv8848@1.0.1.
// This viewport isolates U1's VM pad, where the canvas renderer has sharp
// variable-width trace edges that do not appear in circuit-to-svg.
const circuitElements = tiBoostDrv8848Pcb as AnyCircuitElement[]

test("TI BOOST-DRV8848 U1 VM pad - canvas vs SVG", async () => {
  const stackedPng = await getStackedPngSvgComparison(circuitElements, {
    width: 400,
    height: 640,
    viewport: {
      minX: -1.05,
      maxX: 0.4,
      minY: -11.85,
      maxY: -9.45,
    },
  })

  await expect(stackedPng).toMatchPngSnapshot(import.meta.path)
})
