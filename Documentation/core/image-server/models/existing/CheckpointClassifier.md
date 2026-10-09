# CheckpointClassifier

`core/image-server/models/existing/CheckpointClassifier.js`

Says what architecture an image checkpoint is, from its `.safetensors` header
rather than its filename, and whether the one-click import can load it.

## Methods

- `CheckpointClassifier.classify(filePath, hint?)` returns
  `{ compatible, baseType?, archLabel, reason?, guessed?, promptStyle? }`.
  `hint.allInOne === false` marks ComfyUI's UNet-only folders.
  - `.gguf`: incompatible (needs companions).
  - `.ckpt`: SD 1.5 with `guessed: true`; incompatible from a UNet-only folder.
  - SDXL (`conditioner.embedders.1.`) and SD 1.5 (`cond_stage_model.transformer.`):
    compatible only with a baked VAE (`first_stage_model.`).
  - SDXL refiner, SD 2.x, Flux (`double_blocks.`), SD3 (`joint_blocks.`),
    diffusion-only files, unreadable headers and unknown files: incompatible with a reason.
- `CheckpointClassifier.guessPromptStyle(baseType, fileName)` returns
  `'sdxl-pony'` or `'sdxl-illustrious'` (Illustrious, Noob, ILXL, WAI) for SDXL
  names, else `undefined`.
- `NEEDS_COMPANIONS` is the shared reason tail.

## Why

The import loads one all-in-one file with sd.cpp's `-m`, which is what SD 1.5
and SDXL checkpoints are. UNet-only files need encoders the import cannot
supply, so they are reported as skipped instead of offered and then failing at
launch. A `.ckpt` is a pickle with no header to read safely; the `.ckpt` era
was SD 1.x almost without exception and sd.cpp detects the real architecture at
load, so only the default canvas rides on the guess. Booru-tag SDXL families
prompt differently and the filename is the only cue.
