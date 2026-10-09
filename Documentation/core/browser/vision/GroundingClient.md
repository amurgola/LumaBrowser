# GroundingClient

`core/browser/vision/GroundingClient.js`

Screenshot + description in, pixel point out. Transport-agnostic: the same
client drives the in-app vision fallback and the calibration suite, so the
numbers the suite reports are the numbers the product gets.

## Methods

- `new GroundingClient({ complete, imageOps, profile })`. `complete(messages, body)`
  is an OpenAI-compatible chat call returning the reply text; `imageOps` provides
  `size`, `resize`, `crop`, `toDataUrl` (see [ImageOps](ImageOps.md));
  `profile` is a [GroundingProfiles](GroundingProfiles.md) id, a model name or a
  profile object (default `pixels`). Throws without `complete` or `imageOps`.
- `GroundingClient.sentSizeFor(profile, width, height)`: the size to send.
  Factor profiles get `CoordinateSpace.smartResize` (patch multiples inside the
  pixel budget, so the runtime neither resizes nor pads); others are capped at
  `maxLongEdge` (default 1568), never upscaled.
- `pass(image, instruction)`: one call. Returns `{ ok, point, bbox?, raw, sent, ms }`
  in `image` pixels, or `{ ok: false, infeasible?, raw, sent, ms, error }`.
- `locate({ image, instruction, zoom = false })`: a coarse pass, plus an
  optional zoom refine (`true` or `{ fraction, minSize, maxShift }`). Returns
  the pass fields plus `passes` (each stage), `ms`, and with zoom `refined` and
  possibly `rejectedShift`. A blank instruction fails without a call.

## Zoom refine

Crops a window around the coarse answer (`CoordinateSpace.zoomWindow`), asks
again and maps back. Skipped when the window is the whole image; a failed
refine keeps the coarse answer. A refine that moves more than `maxShift`
(default 24) source px is rejected: the crop drops context (in a table, the
column saying WHICH row), and calibration measured an ungated zoom dropping
per-row buttons from 100% to ~50%, every miss exactly one row away, while
genuine corrections moved 0-6 px. Off by default: on web-scale targets it
measured ~no gain for ~2x latency.
