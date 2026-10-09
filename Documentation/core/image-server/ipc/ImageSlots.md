# ImageSlots

`core/image-server/ipc/ImageSlots.js`

The per-slot fan-outs of the image IPC layer over `service.slots()` (generate, edit, video).

## Methods

- `new ImageSlots(imageServerService)`.
- `stopHosting(modelId)` stops every slot whose status plan runs `modelId` and is not idle; failures are swallowed.
- `stopAll()` stops the primary `runtimeServer` (its status is returned), then every other slot (failures ignored).
- `status()` the primary slot's status with `editServer` (the edit slot's) when available.
- `ImageSlots.stopIfRunning(server)` stops a non-idle slot, true when a stop was issued; failures log `[image-server] stop-on-defaults failed:`.
- `ImageSlots.isHosting(status, modelId)`.

## Why

Legacy bug H10: four fan-outs were hand-written generate + edit lists and missed the video slot (worst case: `rmSync` under a live sd-server). Driving every fan-out off `slots()` keeps them complete. sd-server memory-maps weights and reads LoRAs and companions at launch, so a hosting slot must stop before its files change.
