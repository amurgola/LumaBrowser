# Int8WeightsBuilder

`core/image-server/ipc/Int8WeightsBuilder.js`

Builds the INT8 convrot copy of an installed image model's diffusion weights beside the original, one build per
model, with progress on the model event channel; then records it on the manifest and stops slots hosting the model.

## Methods

- `new Int8WeightsBuilder({ imageServerService, scanner?, converter? })`. `converter` has
  [Int8ConvrotConverter](../models/int8/Int8ConvrotConverter.md)'s shape (a test seam).
- `build({ id }, send)` resolves `{ id, file, bytes }`, or `{ success: false, canceled: true }` after `cancel`.
  It reads the model folder (`<modelsDir>/<id>`) through the scanner, converts the diffusion file into
  `<name>.int8.safetensors` beside it with the family's [recipe](../models/int8/Int8ConvrotRecipes.md), reads the
  manifest again and sets `files.diffusion.int8File`, then stops every slot hosting the model
  ([ImageSlots](ImageSlots.md) `stopHosting`) so the next request launches on the copy. Events on `send`:
  `int8-start { id }`, `int8-progress { id, doneBytes, totalBytes }` (at most four a second),
  `int8-end { id, outcome: 'done' | 'canceled' | 'error', message? }`. Refusals throw before `int8-start`:
  `id required`, `invalid model id`, `Model "<id>" not found.`, `ALREADY_BUILT`, `NOT_BUILDABLE`, and `BUSY` for a
  model whose build is running. A converter failure sends `int8-end` with `error` and throws; the converter never
  leaves a partial file and the manifest is untouched.
- `cancel(id)` aborts that model's build (nothing when none runs).
- `progressOf(id)` `{ doneBytes, totalBytes }` of the running build, or null.
- `describe(model)` `{ buildable, present, file, bytes, estimatedBytes, building }` for the Setup page
  ([ImageModelsView](ImageModelsView.md)): `estimatedBytes` is `SIZE_RATIO` of the source size.
- `Int8WeightsBuilder.canBuild(model)`: the family has a recipe, the diffusion file is `.safetensors`, and the
  manifest lists the diffusion role (where the copy is recorded; a manifest-free folder has none).
- `Int8WeightsBuilder.fileNameFor(sourceFile)` `anima-base-v1.0.safetensors` to `anima-base-v1.0.int8.safetensors`.
- Statics: `SOURCE_EXT`, `SUFFIX`, `SIZE_RATIO` (0.56), `PROGRESS_TICK_MS`, `BUSY`, `NOT_BUILDABLE`, `ALREADY_BUILT`.

## Why

sd.cpp loads the copy as is and runs the converted linear layers on INT8 tensor cores: Anima measured 5.6 steps/s
against 3.4 on an RTX 5090 and 2.4 against 1.25 on an RTX 3090 (2026-11-22), with the image judged equal. The
build is never automatic (not at install or import): it costs disk (about 56% of a 16-bit file) and the user asks
for it. The manifest is read again after the conversion so an edit made meanwhile (a LoRA attached) survives. Builds
are not part of the shared [ImageDownloadSlot](ImageDownloadSlot.md): they use the CPU and the local disk, not the
network, so they do not wait on a download, and their events carry their own types so the download strip ignores
them.
