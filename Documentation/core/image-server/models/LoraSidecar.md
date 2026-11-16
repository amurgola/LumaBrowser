# LoraSidecar

`core/image-server/models/LoraSidecar.js`

The small JSON file beside a library LoRA that records what a trained LoRA is for.

## Methods

- `LoraSidecar.pathFor(loraPath)`: `x.safetensors` -> `x.lora.json`.
- `LoraSidecar.read(loraPath)`: the stored fields, or null when missing or unreadable.
- `LoraSidecar.write(loraPath, meta)`: stores only the known fields and returns them;
  null (and no file) when meta carries none.
- `LoraSidecar.clean(meta)`: keeps `family`, `recipeId`, `trainedFor`, `trigger`,
  `trainer`, `steps`, `createdAt`; strings trimmed and capped at 200 characters.

## Why

A LoRA file's header only hints at its base, and never holds a trigger word. A trained
LoRA knows both exactly, so [ImageLoraLibrary](../ipc/ImageLoraLibrary.md) reports the
sidecar's family instead of the header guess.
