# ImportCompanions

`core/image-server/ipc/ImportCompanions.js`

Links the companion files a diffusion-only import needs (VAE, text encoder, vision projector) in from an installed model of the same family.

## Methods

- `ImportCompanions.attach(entry, dir, modelsDir)` dispatches on `entry.baseType`: Qwen bases -> `attachQwen`, `anima` -> `attachAnima`, else null.
- `attachQwen(entry, dir, modelsDir)` needs a sibling manifest with `llm`, `vision` and `vae`; the family must match `entry.family` (default `qwen-image-edit`), and a manifest with no family is accepted only for that legacy edit base. Adds `vae`, `llm`, `vision` (loader flag from the source, default `--llm_vision`).
- `attachAnima(entry, dir, modelsDir)` needs a sibling whose manifest family or id is `anima` with `vae` and `llm`.
- Results: `{ ok: true, from: <folder> }`, `{ error }` (the missing-set texts `QWEN_21_MISSING`, `QWEN_EDIT_MISSING`, `ANIMA_MISSING`, or `Failed to link <Qwen|Anima> companion files: <reason>`). Files are hardlinked, copied when linking fails, and kept when already present.

## Why

The scanner only resolves files inside the model's own folder. Companion sets are family-scoped: Qwen-Image-Edit 2509 runs on Qwen2.5-VL and the original VAE, Qwen-Image 2.1 on Qwen3-VL-8B and its own VAE; neither loads with the other's files.
