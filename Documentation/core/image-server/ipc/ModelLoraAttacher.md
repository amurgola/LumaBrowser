# ModelLoraAttacher

`core/image-server/ipc/ModelLoraAttacher.js`

Attaches or clears an installed model's LoRAs by rewriting its manifest `defaults.loras`.

## Methods

- `new ModelLoraAttacher({ imageServerService, loraCatalog? })`.
- `attach({ id, loras, distilledPreset?, preset? })` writes the cleaned list (or removes `loras`), applies the preset recipe when `distilledPreset` and at least one LoRA (the given `preset`, else the curated one, else the fallback; see [LoraPresetRecipe](LoraPresetRecipe.md)), otherwise removes any preset, then stops slots hosting the model. Refusals throw `id required`, `NO_MANIFEST` (also for ids outside the models folder) or `Could not read manifest: <reason>`.

## Why

`--lora-model-dir` is a launch argument and LoRAs fold in at load, so a server already hosting the model must relaunch to apply the change.
