# BasaltContextSizer

`extensions/basalt-runtime/BasaltContextSizer.js`

Sizes Basalt's context.

## Methods

- `BasaltContextSizer.fit({ requested, nativeCtx, pack, kv, slots, vramBytes })`
  returns `{ contextSize, fits, estimatedBytes, notes }`. The context is
  `min(requested, nativeCtx)`.
  - A `sizing: 'card'` pack: `needBytes` must stay within the card less
    `CARD_RESERVE_BYTES` (2.5 GiB); if not, the largest `CTX_LADDER` rung that
    fits is taken with a "Context reduced" note; if none fits, `fits: false`
    with a note. No card figure means no check.
  - Any other pack (mixture of experts, unknown): the context as asked,
    `fits: true`, `estimatedBytes` the card less the reserve, and a note that
    the engine places the experts and refuses a context that does not fit.
- `needBytes(pack, kv, ctx, slots)`: `cardFixedBytes + (slots - 1) * slotStateBytes + ctx * bytesPerPosition`.
- `formatBytes(n)`: GiB with one decimal, else MiB.

## Why

The dense 27B sits on the card, so it is priced like NInfer's sizer does; its
KV is shared by the slots (`--max-context` is split), and each extra slot adds
157 MiB of recurrent state. The mixture-of-experts packs fill the card with
their expert cache whatever the context and spill to RAM or the pack file, so
a VRAM sum would be wrong; Basalt itself refuses at start a context that does
not fit and names the free memory. The reserve covers the display's share on
the main card (about 2.4 GiB measured on the 5090) and the driver; the plan
runs before the launch reclaims any pooled card, so the card's total, not its
live free memory, is the base.
