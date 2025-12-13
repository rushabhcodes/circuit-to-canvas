# circuit-to-canvas

Draw [Circuit JSON](https://github.com/tscircuit/circuit-json) into a Canvas- works with any canvas object (Node/Vanilla)

[![NPM Version](https://img.shields.io/npm/v/circuit-to-canvas)](https://npmjs.com/package/circuit-to-canvas)

```tsx
const drawer = new CircuitToCanvasDrawer(canvasOrCanvasRenderingContext2d)

// Sets the internal transformation matrix for all operations
drawer.setCameraBounds({ minX: 0, maxX: 100, minY: 0, maxY: 100 })

drawer.configure({
  colorOverrides: {
    topCopper: "#ff0000"
  }
})

// Accepts a circuit json array, by default draws on all layers
drawer.drawElements([pcbPlatedHole], {
  layers: ["top_copper"]
})
```

## Implementation Notes

There are two "types" of layers:

- Specific drawing layers e.g. "top_copper"
- Layer groups "top" (includes "top_copper", "top_soldermask")

inner layers go by the name inner1, inner2 etc.

## Feature Parity with circuit-to-svg

This checklist tracks PCB drawing features from [circuit-to-svg](https://github.com/tscircuit/circuit-to-svg) that are implemented in circuit-to-canvas.

### PCB Elements

- [x] `pcb_board` - Board outline with center/width/height or custom outline
- [x] `pcb_trace` - PCB traces with route points
- [x] `pcb_via` - Via holes
- [x] `pcb_plated_hole` - Plated through-holes (circular, pill, oval shapes)
- [x] `pcb_hole` - Non-plated holes (circular, square, oval shapes)
- [x] `pcb_smtpad` - SMT pads (rect, circle, rotated_rect, pill shapes)
- [x] `pcb_copper_pour` - Copper pour areas (rect, polygon shapes)
- [x] `pcb_cutout` - Board cutouts (rect, circle, polygon shapes)

### Silkscreen Elements

- [x] `pcb_silkscreen_text` - Text on silkscreen layer
- [x] `pcb_silkscreen_rect` - Rectangles on silkscreen
- [x] `pcb_silkscreen_circle` - Circles on silkscreen
- [x] `pcb_silkscreen_line` - Lines on silkscreen
- [x] `pcb_silkscreen_path` - Paths/routes on silkscreen

### Copper Text

- [ ] `pcb_copper_text` - Text rendered on copper layers (supports knockout mode, mirroring)

### Error Visualization

- [ ] `pcb_trace_error` - Trace routing error indicators
- [ ] `pcb_footprint_overlap_error` - Footprint overlap error indicators

### Debug/Development Features

- [x] `pcb_component` - Component bounding box visualization
- [ ] `pcb_group` - PCB group visualization with dashed outlines
- [ ] `pcb_courtyard_rect` - Component courtyard rectangles

### Fabrication Notes

- [x] `pcb_fabrication_note_text` - Fabrication note text
- [ ] `pcb_fabrication_note_rect` - Fabrication note rectangles
- [ ] `pcb_fabrication_note_path` - Fabrication note paths
- [ ] `pcb_fabrication_note_dimension` - Fabrication dimension annotations

### Annotation/Notes

- [ ] `pcb_note_text` - General note text
- [ ] `pcb_note_rect` - Note rectangles
- [ ] `pcb_note_path` - Note paths
- [ ] `pcb_note_line` - Note lines
- [ ] `pcb_note_dimension` - Dimension annotations

### Panel Support

- [ ] `pcb_panel` - PCB panel outlines for panelization

### Visualization Features

- [ ] Rats nest visualization - Unrouted connection indicators
- [ ] PCB grid overlay - Configurable grid with major/minor lines
- [ ] Soldermask rendering - Soldermask layer visualization
- [ ] Anchor offset indicators - Debug indicators for relative positioning
