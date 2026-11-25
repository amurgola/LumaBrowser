# Int8WeightsRemover

`core/image-server/ipc/Int8WeightsRemover.js`

Deletes an installed image model's INT8 copy of its diffusion weights and clears it from the manifest.

## Methods

- `new Int8WeightsRemover(imageServerService)`.
- `remove(id)` stops every slot hosting the model ([ImageSlots](ImageSlots.md) `stopHosting`), deletes
  `files.diffusion.int8File` from the model folder (a copy already gone is fine), then removes the field from the
  manifest. Refusals throw: `id required`, `invalid model id`, `NONE` (no manifest, or no copy recorded).
- Statics: `NONE`.

## Why

sd-server memory-maps its weights and a delete under a live child fails on Windows, so the slot stops first. The
manifest is cleared only after the file is gone, so a failed delete leaves the model as it was. The next launch
uses the 16-bit file. Built by [Int8WeightsBuilder](Int8WeightsBuilder.md).
