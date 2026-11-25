# Int8ConvrotConverter

`core/image-server/models/int8/Int8ConvrotConverter.js`

Writes an INT8 convrot copy of a safetensors diffusion checkpoint.

## Methods

- `Int8ConvrotConverter.convert({ sourcePath, outputPath, layerPattern, onProgress?, signal?, workers? })`
  resolves `{ outputPath, layers, bytes }`. `onProgress({ doneBytes, totalBytes })` fires after every tensor.
  `signal` is an AbortSignal. `workers` is an [Int8ConvrotWorkers](Int8ConvrotWorkers.md) (a test seam). Rejects
  with `This model has no layers that can be stored as INT8.` when nothing matches, with `The conversion was
  stopped.` on abort, or with the failure of a layer or of the file system.

## Why

sd.cpp loads these files as they are and runs their linear layers on INT8 tensor cores. On Anima that measured
5.6 steps per second against 3.4 for the BF16 original on an RTX 5090 (1.65 times), and 2.4 against 1.25 on an
RTX 3090, with images of the same quality; a 4-bit copy was no faster and visibly softer (2026-11-22).

The copy is written to `<outputPath>.partial` and renamed when complete, and the partial file is removed on any
failure, so a half-written model can never be picked up. The plan ([Int8ConvrotPlan](Int8ConvrotPlan.md)) fixes
every offset first; converted layers and copied tensors are then written side by side at their own positions.
