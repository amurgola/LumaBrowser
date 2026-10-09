# ImageSlotWarmer

`core/shell/extensions/ImageSlotWarmer.js`

Pre-warms an image slot's server (`context.chat.warmImageSlot`), e.g. the edit
server while the generate server is still painting.

## Methods

- `new ImageSlotWarmer({ gpuCount, sharePool, imageService })`, all optional (tests).
  Defaults: `CudaDeviceProbe.gpuCount`, `HotswapCoordinator.shared.sharePool`,
  `ExtensionGlobals.imageServerService`.
- `ImageSlotWarmer.warmAction(status, wantId)` `'start'` unless the slot is
  `ready`/`starting`, then `'coalesce'` when its plan runs `wantId`, else `'switch'`.
- `warm(slot, modelRef?)` (`'edit'` or `'generate'`) resolves undefined and never
  throws. Skipped with fewer than two GPUs or when both image roles share one
  hotswap pool. The model is `modelRef` without `local::`, else the default
  (edit falls back to the generate model). A switch stops the resident server
  first; then `startServerResolved(model, { role })`.

## Why

On one card the servers share VRAM, and racing an in-flight load in a shared
pool wedges the ImageRouter coalesce; the router's coalesce-on-starting path is
the safety net there.
