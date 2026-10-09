# ReactionImageRenderer

`extensions/roleplay-mode/pipeline/ReactionImageRenderer.js`

Renders the reaction image inside an open exclusive image window.

## Methods

- `new ReactionImageRenderer(chat)`;
  `render({ data, content, directorShot, sig, turn, abortSeq })`.
  Order: emotion faces, `mode:image-start`, plate (integrated, composite,
  nativeImage composite, painted), harmonize or refine, then store and emit
  (`mode:image`, or `mode:image-fail`).

## Why

Bug fixed: legacy wrapped the composite step in a try/catch that also swallowed
the cancel thrown while posing a figure, so a cancelled reaction fell through to
the nativeImage composite and shipped an image. CompositePlate now rethrows the
cancel (test: "a cancel while posing a figure stops the reaction").
