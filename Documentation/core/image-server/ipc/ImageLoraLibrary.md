# ImageLoraLibrary

`core/image-server/ipc/ImageLoraLibrary.js`

The shared `loras/` library beside the image models folder (what sd-server's `--lora-model-dir` points at).

## Methods

- `new ImageLoraLibrary({ imageServerService, slot, loraCatalog?, pickPath? })`; `dir()`.
- `list()` `{ dir, loras: [{ name, file, bytes, base, families, form }] }` for each `.safetensors` file; inspection ([LoraInspector](../models/LoraInspector.md)) is cached per path, size and mtime.
- `import(event, { path? })` with no path opens a picker (`{ canceled: true }` on cancel). Refuses missing files, non-`.safetensors`, unreadable headers and full checkpoints (`NOT_A_LORA`), copies into the library, repacks Qwen-Image 2.1 fused-MLP aliases on the copy ([LoraRepacker](../models/LoraRepacker.md)), and returns `{ name, file, base, families, form, repacked }`.
- `catalogView()` `{ loras }`: each curated entry plus `name`, `installed` (every file present), `pair`, `attach: [{ name, highNoise? }]`.
- `download({ id }, send)` downloads every file of a curated entry into the library through the slot, repacks where needed (failures logged), resolves `{ success, id, name }`. Refusals: `A LoRA catalog id is required.`, the busy slot, `Catalog entry has no downloadable files.`.
- `ImageLoraLibrary.nameOf(file)` the name without `.safetensors`.

## Why

A LoRA's `name` is its file name without the extension; the router re-adds it when building the wire entries (sd-server ignores `<lora:>` prompt tags). The user's source file is never repacked, only the library copy; a failed repack keeps the plain copy, which still applies partially.
