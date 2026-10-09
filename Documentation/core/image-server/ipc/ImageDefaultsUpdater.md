# ImageDefaultsUpdater

`core/image-server/ipc/ImageDefaultsUpdater.js`

Saves the image defaults, stops the slots a change made stale and reconciles the RAM-pin worker.

## Methods

- `new ImageDefaultsUpdater(imageServerService)`.
- `update(payload)` resolves `{ defaults, serverStopped }`. A key counts as changed when present in the payload and different after the save. Each slot whose `defaultKey` changed, or every slot when `runtimeId` changed, is stopped if not idle (`ImageSlots.stopIfRunning`). `ramPin.apply()` runs when `pinModelRam` changed, or when `modelId` / `editModelId` changed while pinning is on.

## Why

A running server is bound to the model it was launched with, so a silent stale launch must be impossible. The RAM pin lives in its own worker and running servers are unaffected by it, so it is reconciled, not slot-stopped; the video default is never pinned (see ImagePinTarget).
