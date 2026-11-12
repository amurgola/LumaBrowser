# ModelLoraAttacher

`core/image-server/ipc/ModelLoraAttacher.js`

Attaches or clears an installed model's LoRAs by rewriting its manifest `defaults.loras`.

## Methods

- `new ModelLoraAttacher({ imageServerService, loraCatalog? })`.
- `attach({ id, loras, distilledPreset?, preset? })` writes the cleaned list (or removes `loras`), applies the preset recipe when `distilledPreset` and at least one LoRA (the given `preset`, else the curated one, else the fallback; see [LoraPresetRecipe](LoraPresetRecipe.md)), otherwise removes any preset, then stops slots hosting the model. Refusals throw `id required`, `NO_MANIFEST` (also for ids outside the models folder) or `Could not read manifest: <reason>`.

- Edit LoRAs: when an attached LoRA's curated entry has `enablesEdit` (Krea 2 General Edit), the manifest gets `supportsEdit: true` with `editFromLora: true`; clearing the LoRA removes both. A manifest that already had `supportsEdit` is left alone both ways.

## Why

A model that only edits through a LoRA should be offered as an edit model exactly while that LoRA is attached.

`--lora-model-dir` is a launch argument and LoRAs fold in at load, so a server already hosting the model must relaunch to apply the change.
