# VisionProjectorPlan

`core/llm-server/server/launch/VisionProjectorPlan.js`

Decides whether a launch loads the model's vision projector (`--mmproj`).

## Methods

- `VisionProjectorPlan.resolve({ files, flags, overrides })` returns
  `{ mmprojSuppressed, mmprojAvailable, effectiveMmprojPath, effectiveMmprojBytes }`.
  Suppressed when the runtime lists `mmproj` in `skipFeatures`; available when the
  model ships one and it is not suppressed; loaded when available and
  `overrides.suppressMmprojLoad` is not set.

## Why

ik_llama b4321 segfaults in CLIP warmup on qwen35, so such runtimes skip the
projector. Its VRAM can tip a model from full into partial offload, so chat passes
`suppressMmprojLoad` on image-free turns and restarts with it when an image
arrives; `mmprojAvailable` tells chat whether that restart is worth it.
