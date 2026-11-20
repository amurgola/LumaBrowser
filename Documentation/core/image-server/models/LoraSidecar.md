# LoraSidecar

`core/image-server/models/LoraSidecar.js`

The small JSON file beside a library LoRA that records what the LoRA is for: a trained
LoRA's family, recipe and trigger word, or a CivitAI install's base, listing and trigger words.

## Methods

- `LoraSidecar.pathFor(loraPath)`: `x.safetensors` -> `x.lora.json`.
- `LoraSidecar.read(loraPath)`: the stored fields, or null when missing or unreadable.
- `LoraSidecar.write(loraPath, meta)`: stores only the known fields and returns them;
  null (and no file) when meta carries none.
- `LoraSidecar.clean(meta)`: keeps the trainer's fields (`TRAINED_FIELDS`: `family`,
  `recipeId`, `trainedFor`, `trigger`, `trainer`, `steps`, `createdAt`) and a listing's
  (`LISTING_FIELDS`: `source`, `base`, `baseModel`, `label`, `modelId`, `versionId`,
  `fileId`, `sha256`, `pageUrl`, `creator`, `licenseNote`); strings trimmed and capped at
  500 characters (a CivitAI trigger can be a sentence), numbers kept, anything else dropped.

## Why

A LoRA file's header only hints at its base, and never holds a trigger word. A trained
LoRA knows both exactly, so [ImageLoraLibrary](../ipc/ImageLoraLibrary.md) reports the
sidecar's family instead of the header guess. A LoRA installed from CivitAI
([CivitaiLoraResolver](../civitai/CivitaiLoraResolver.md) builds its record) carries
`source: 'civitai'` and its LoRA `base`, from which the library derives the families.
