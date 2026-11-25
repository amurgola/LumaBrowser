# Int8ConvrotWorker

`core/image-server/models/int8/Int8ConvrotWorker.js`

Worker thread entry of the INT8 convrot conversion. Loaded by path, never required from the app.

## Methods

- `Int8ConvrotWorker.convert(task)` reads one layer from `task.sourcePath` (`position`, `length`), decodes it
  (`dtype`) and returns `{ codes, scales }` from [Int8ConvrotLayer](Int8ConvrotLayer.md). Throws `The model file
  ended before the layer did.` on a short read.
- `Int8ConvrotWorker.listen(port)` answers `{ id, task }` messages with `{ id, codes, scales }` (the two buffers
  are transferred, not copied) or `{ id, error }`.

## Why

A layer is up to 16.8 million weights; rotating and rounding it on the main thread would freeze the app for
seconds. The worker reads its own slice of the file, so only the small result crosses threads.
