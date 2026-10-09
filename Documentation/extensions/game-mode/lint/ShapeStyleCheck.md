# ShapeStyleCheck

`extensions/game-mode/lint/ShapeStyleCheck.js`

The Shape versus Graphics style mixup: `add.rectangle()` and friends return Shapes (`setFillStyle`/`setStrokeStyle`), `fillStyle`/`lineStyle` exist only on Graphics; both directions throw. Decided by the factory named in the same statement (back to the nearest `;`, `{` or `}`, within 400 chars).

## Methods

- `ShapeStyleCheck.findings(text)` -> `[{ index, id: shape-fillstyle | graphics-setfillstyle, message }]`.
