# CivitaiLoraResolver

`core/image-server/civitai/CivitaiLoraResolver.js`

Turns a CivitAI LoRA (a page URL, a download URL, or ids) into what [CivitaiLoraInstaller](../ipc/CivitaiLoraInstaller.md) puts in the LoRA library: the version's `.safetensors` file, the LoRA base its `baseModel` maps to, the file name it lands under, the download URL and the sidecar record. Reads the API only.

## Methods

- `new CivitaiLoraResolver({ reader?, now? })`; `reader` is a [CivitaiModelResolver](CivitaiModelResolver.md) (its `read` fetches the model and version), `now` a clock seam.
- `resolve({ url?, modelId?, versionId?, fileId? })` resolves `{ model, version, file, base, fileName, url, record }` or `{ error }`. `base` is a [CivitaiLoraBaseMap](CivitaiLoraBaseMap.md) answer.
- `CivitaiLoraResolver.refusal(model, version)` why a version cannot go into the library, or null. In order: `NOT_A_LORA(type)` for anything that is not a `LORA`, `LoCon` or `DoRA` (a checkpoint is pointed at Browse CivitAI in the Models section), `DORA_UNSUPPORTED` for a DoRA, the base map's note for a base without a model family, `CivitAI version <id> has no .safetensors LoRA file.` The search view uses the same function for its verdicts, so a row and an install never disagree.
- `pickFile(version, fileId?)` among the version's `Model` files named `*.safetensors`: the requested id (null when it is not one of them), else the primary, else the first.
- `fileName(file)` the listing's file name with the characters a folder refuses (`< > : " / \ | ? *` and control characters) replaced by `_`, trailing dots and spaces dropped, and `.safetensors` normalised; `civitai-<fileId>.safetensors` when nothing is left.
- `record({ model, version, file, base, now })` the [LoraSidecar](../models/LoraSidecar.md) fields: `source: 'civitai'`, `base` (the LoRA base id), `baseModel` (CivitAI's name, e.g. `Pony`), `label` (`"<model> <version>"`), `modelId`, `versionId`, `fileId`, `sha256`, `pageUrl`, `creator`, `trigger` (the trained words joined with `, `), `licenseNote`, `createdAt`.

## Why

- LyCORIS adapters (CivitAI type `LoCon`) are LoRAs here: sd.cpp loads LoHa and LoKr.
- DoRAs are refused because sd.cpp reads a DoRA's low-rank pair but skips its `dora_scale` magnitudes (a TODO in its LoRA loader, checked 2026-11-18), so one would render as a wrong plain LoRA.
- Only `.safetensors` is taken: the library lists nothing else, and a pickle file would be code.
- The record carries the ids and hash so a later "newer version" check can ask CivitAI about the file, the same hook checkpoints have in their manifest.
