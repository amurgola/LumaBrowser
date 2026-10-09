# SafetensorsHeader

`core/image-server/models/SafetensorsHeader.js`

Reads and encodes the 8-byte length prefix plus JSON header of a `.safetensors`
file without touching tensor data.

## Methods

- `SafetensorsHeader.read(fd)` returns `{ json, dataStart }` for an open file
  descriptor; `dataStart` is the absolute offset of tensor data. Throws
  `File too small for a safetensors header.`, `Not a safetensors file
  (implausible header length).` (length 0 or above 100 MB), `Truncated
  safetensors header.`, or `Not a safetensors file (header is not JSON).`
- `SafetensorsHeader.readFile(filePath)` opens the file, calls `read`, and
  closes it; it throws the same errors, or the fs error for a missing file.
- `SafetensorsHeader.metadata(header)` returns the `__metadata__` object, or
  `{}` when it is absent or not an object.
- `SafetensorsHeader.encode(header)` returns the length prefix plus JSON body,
  space-padded to an 8-byte boundary as the format requires.
- `SafetensorsHeader.tensorNames(header)` returns every key except `__metadata__`.

## Why

Split from the LoRA repacker so header I/O is one small, tested unit. A header
read never loads tensor data, so multi-GB files are inspected cheaply.

Used by LoraRepacker (`read`), LoraInspector and CheckpointClassifier
(`readFile`, `tensorNames`, `metadata`), which replaced their own header
readers. If a second subsystem needs it, it belongs in `core/shared`.
