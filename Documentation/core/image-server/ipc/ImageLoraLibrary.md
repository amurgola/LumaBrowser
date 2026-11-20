# ImageLoraLibrary

`core/image-server/ipc/ImageLoraLibrary.js`

The shared `loras/` library beside the image models folder (what sd-server's `--lora-model-dir` points at).

## Methods

- `new ImageLoraLibrary({ imageServerService, slot, loraCatalog?, pickPath? })`; `dir()`.
- `list()` `{ dir, loras: [{ name, file, bytes, base, families, form, label?, trigger?, trained?, listing? }] }` for each `.safetensors` file; inspection ([LoraInspector](../models/LoraInspector.md)) is cached per path, size and mtime. `families` are the image model families the LoRA fits, which is what the LoRA dialog offers it by.
- `adopt(filePath, record?)` files a LoRA a download just put in the library: a file that is unreadable or not a LoRA is deleted and refused (`NOT_A_LORA`), a Qwen-Image 2.1 adapter is repacked, `record` is written as the [LoraSidecar](../models/LoraSidecar.md), and the library row is returned. [CivitaiLoraInstaller](CivitaiLoraInstaller.md) calls it.
- `ImageLoraLibrary.headerBase(filePath)` `{ base, families }` from the file's own header, sidecar aside (`base` null and no families when unrecognised or unreadable).
- `import(event, { path? })` with no path opens a picker (`{ canceled: true }` on cancel). Refuses missing files, non-`.safetensors`, unreadable headers and full checkpoints (`NOT_A_LORA`), copies into the library, repacks Qwen-Image 2.1 fused-MLP aliases on the copy ([LoraRepacker](../models/LoraRepacker.md)), and returns `{ name, file, base, families, form, repacked }`.
- `catalogView()` `{ loras }`: each curated entry plus `name`, `installed` (every file present), `pair`, `attach: [{ name, highNoise? }]`.
- `download({ id }, send)` downloads every file of a curated entry into the library through the slot, repacks where needed (failures logged), resolves `{ success, id, name }`. Refusals: `A LoRA catalog id is required.`, the busy slot, `Catalog entry has no downloadable files.`.
- `ImageLoraLibrary.nameOf(file)` the name without `.safetensors`.

## Why

A LoRA's `name` is its file name without the extension; the router re-adds it when building the wire entries (sd-server ignores `<lora:>` prompt tags). The user's source file is never repacked, only the library copy; a failed repack keeps the plain copy, which still applies partially.

## Trained LoRAs

`import(event, { path, meta })` writes `meta` (a trainer's family, recipe, source model and
trigger word) beside the copy as its [LoraSidecar](../models/LoraSidecar.md) and returns it
as `trained`. `list()` rows of such a LoRA carry `trained` too, and their `families` come
from the sidecar rather than from the header guess.

## Listed LoRAs

A sidecar with a `source` (a CivitAI install) is a listing record. Its `base` is a
[LoraBaseDetector](../models/LoraBaseDetector.md) base id, and the row's `families` are that
base's families, ahead of the header guess: the listing can tell Pony from plain SDXL and
SD 1.5 from an ambiguous UNet LoRA. The row's `base.label` names both when they differ
(`Pony (SDXL)`), and the record rides on the row as `listing`, never as `trained`, so the
trainer add-on does not list it as its own. A record naming a base the detector does not
know falls back to the header.

Every row with a sidecar also carries `label` (the listing's "<model> <version>") and
`trigger` (the trigger words of a trained or a listed LoRA) at the top level.
