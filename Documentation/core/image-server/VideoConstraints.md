# VideoConstraints

`core/image-server/VideoConstraints.js`

Normalises a video request onto the model catalog row's `constraints` before
the meta event goes out, and reports every change.

## Methods

- `VideoConstraints.normalizeVideoRequest(req, constraints)` returns
  `{ width, height, videoFrames, fps, adjustments }`. Each adjustment is
  `{ field, from, to, reason }`. Without a constraints object the request passes
  through. Missing request fields stay `null` and are never reported.
- `VideoConstraints.alignUp(n, mult)` rounds up to the next multiple (never
  below one multiple); `null` passes through.
- `VideoConstraints.snapToGrid(n, { step, offset, min, max })` snaps a frame
  count onto `step * k + offset`, clamped to [min, max]; ties round down.

Constraint shape (every field optional):
`{ dimensionMultiple: 32, frames: { step: 17, offset: 5, min: 5, max: 345 }, fps: 24 }`.

## Why

Video architectures fix a dimension alignment (latent packing), a frame-count
grid (temporal patching) and sometimes a frame rate. sd.cpp does not reject an
off-grid request; it silently re-aligns it, so the clip comes back at a size or
length the caller never asked for and the already-emitted meta event is wrong.
Applying the grid once here, with `adjustments`, lets the UI say why 60 frames
became 56.

Ties round down (47 frames on 17k+5 gives 39, not 56) so an unaware caller never
pays for a longer render than requested. MiniMax-H3 uses all three constraints;
Wan uses 4k+1 capped at 81 (/16 dims), LTX 8k+1 capped at 257 (/32 dims); neither
locks fps because for them the container fps is only playback speed.

It stays in image-server rather than `core/shared` because its only consumer is
VideoRouter and the `constraints` shape belongs to the image catalog.

Kept legacy quirk: a request field of `null` (not `undefined`) reads as `0`.
