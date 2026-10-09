# VideoSlotLauncher

`core/image-server/video/VideoSlotLauncher.js`

Makes the video slot's server run the requested model before a render. Extends
[ImageSlotLauncher](../router/ImageSlotLauncher.md); only the wording of its own
errors changes.

## Methods

- `ensureReady({ wantId, slotRole, send })` as ImageSlotLauncher, with
  `Failed to start the image server.` -> `Failed to start the video server.` and
  `Image server is <state>, not ready.` -> `Video server is <state>, not ready.`.
  Errors from the service's own start pass through unchanged.
- `VideoSlotLauncher.relabel(error)` that mapping.

## Why

Legacy VideoRouter had a character-identical copy of the image slot block that
differed only in these two messages; the subclass removes the copy.
ImageSlotLauncher hard-codes its texts, so the relabel is done on the result
(see the NOTES change request: a `label` option on ImageSlotLauncher would let
this class go).
