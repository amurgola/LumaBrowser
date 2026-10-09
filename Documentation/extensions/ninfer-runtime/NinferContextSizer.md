# NinferContextSizer

`extensions/ninfer-runtime/NinferContextSizer.js`

Sizes NInfer's context against the card.

## Methods

- `NinferContextSizer.needBytes(weightsBytes, ctx)` is weights + ctx *
  `KV_BYTES_PER_TOKEN` + `WORKSPACE_BYTES`.
- `NinferContextSizer.fit({ requested, nativeCtx, weightsBytes, vramBytes })`
  returns `{ contextSize, fits, notes }`. The start is `min(requested, nativeCtx)`.
  Without `vramBytes`, or when it fits under `vramBytes - CARD_RESERVE_BYTES`,
  it is kept. Otherwise the largest `CTX_LADDER` rung at or below it that fits
  is used, with a `Context reduced from ... to ...` note; when none fits, the
  size is kept, `fits` is false and the note says even 4096 tokens do not fit.
- Statics: `CTX_LADDER` (262144 down to 4096), `CARD_RESERVE_BYTES` (1.5 GiB).
