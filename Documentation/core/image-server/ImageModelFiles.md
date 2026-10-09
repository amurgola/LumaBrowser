# ImageModelFiles

`core/image-server/ImageModelFiles.js`

Resolves the role-to-file bag (`{ diffusion, vae, llm, ... }`) of one image
model directory, used by [ImageModelsScanner](ImageModelsScanner.md).

## Methods

- `ImageModelFiles.fromManifest(dir, manifestFiles)` resolves
  `{ [role]: { ...manifestEntry, role, file, path, bytes } }`. The basename is
  `entry.file` or `entry.name`; empty entries and files missing on disk are
  dropped. Extra manifest fields (notably `loaderFlag`) are kept; `role`,
  `file`, `path` and `bytes` are always fresh.
- `ImageModelFiles.infer(dir)` resolves `{ [role]: { role, file, path, bytes } }`
  for a manifest-free folder, in the order `diffusion, vae, audioVae, llm,
  clip_l, t5xxl`. Only `.gguf .safetensors .ckpt .bin .pth .pt` files count; the
  first file of each role wins. An unreadable folder gives `{}`.
- `ImageModelFiles.roleFor(fileName)` guesses one name's role:
  `audio`+`vae` -> `audioVae`; starts with `ae` or has `vae` -> `vae`;
  `clip_l`/`clip-l` -> `clip_l`; `t5xxl`/`t5-xxl` -> `t5xxl`;
  `qwen`/`ministral`/`text_encoder` -> `llm`; anything else -> `diffusion`.
- Statics: `WEIGHT_EXTS`, `INFERRED_ROLES`.

## Why

The guess lets a user drop their own model folder in without writing JSON.
Audio-video models ship two decoders, so the audio one is matched first or it
would take the plain `vae` role. `loaderFlag` must survive rehydration because
single-file SD 1.5 / SDXL checkpoints need it to load.
