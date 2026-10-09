# ModelDirectoryScanner

`core/media-shared/ModelDirectoryScanner.js`

Base class for the media servers' model-directory scanners: list a directory,
describe each usable entry, return the descriptors sorted.

## Methods

- `scan(dir)` reads `dir`, calls `_describeEntry(dir, dirent)` for every entry,
  keeps the non-null results and sorts them by `_sortKey(model)`. A missing or
  unreadable directory scans as `[]`.
- `ModelDirectoryScanner.onnxFilesIn(files)` keeps names ending in `.onnx`
  (case-insensitive).

Protected hooks for subclasses:

- `_describeEntry(dir, dirent)` (abstract, throws) returns a descriptor with at
  least `id`, `name`, `sizeBytes`, or `null` to skip the entry.
- `_sortKey(model)` defaults to `model.id`.
- `_listFiles(modelDir)` returns the folder's names or `null` when unreadable.
- `_fileSize(filePath)` returns the size or `null`.
- `_sumFileSizes(modelDir, files)` sums sizes, counting unreadable files as 0.

## Implementations

- `core/tts-server/TtsModelsScanner.js` (one folder per voice model)
- `core/whisper-server/WhisperModelsScanner.js` (flat `.bin` files, sorted by name)
- `core/whisper-server/sherpa/SherpaSttScanner.js` (one folder per STT model)

The level-2 image scanner (`core/image-server/modelsScanner.js`) may be able to extend it.

## Why

Scans run on every panel refresh, so they must never throw. The three legacy
scanners each repeated the same readdir, try/catch, size-sum and sort skeleton;
only the per-entry detection differs.
