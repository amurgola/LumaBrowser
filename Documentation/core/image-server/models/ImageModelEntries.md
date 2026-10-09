# ImageModelEntries

`core/image-server/models/ImageModelEntries.js`

Data-only class holding the curated image and video model rows. Read it
through [ImageModelCatalog](ImageModelCatalog.md).

## Members

- `ImageModelEntries.ENTRIES`: Z-Image Turbo, Qwen-Image-Edit 2509,
  Qwen-Image 2.1, SD 1.5, SDXL base, Sprite Shaper XL, FLUX.1 Schnell,
  Chroma1-HD, Chroma1-Flash, FLUX.2 klein 4B (images), then Wan 2.2 T2V, Wan 2.2
  I2V, AniSora V3.2, LTX-Video 2B and MiniMax-H3 (video).
- Shared companions `FLUX_VAE`, `T5XXL_Q8`, `WAN_VAE`, `UMT5_Q8`, plus
  `WAN_VIDEO_DEFAULTS` and `WAN_CONSTRAINTS`. Rows copy the file and default
  objects (spread), so one row cannot mutate another; `WAN_CONSTRAINTS` is
  shared, as in legacy.

## Row shape

`{ id, label, blurb, family, kind: 'generate'|'edit'|'video', supportsEdit?,
supportsI2V?, licenseNote?, files: { <role>: { role, repo, file, url,
approxBytes, loaderFlag?, quants?, supersedes?, updateNote? } }, minVramBytes,
defaults: { width, height, steps, cfgScale, sampler, scheduler?,
negativePrompt?, promptGuide?, videoFrames?, fps?, flowShift? }, constraints?,
launchArgs, protocol: 'sd-cpp-http'|'sd-cpp-video', compatibleRuntimes }`.

Roles map to sd-server flags in the launch planner: `diffusion`, `vae`, `llm`,
`clip_l`, `t5xxl`, `vision` (`--llm_vision`), `highNoise`
(`--high-noise-diffusion-model`), `audioVae` (`--audio-vae`). `quants` must have
exactly one `default` equal to the top-level file and url. `recVramBytes` is the
comfortable GPU-resident size with the encoders on the CPU.

## Why (per row)

- Qwen-Image-Edit 2509: Qwen k-quants render solid black (sd.cpp #1385), so the
  safe Q4_0 / Q6_K / Q8_0 are recommended. `--offload-to-cpu` streams weights
  from RAM and was measured both fastest and the only OOM-proof option at 1 MP.
  The mmproj vision tower is required for references.
- Qwen-Image 2.1: one 7B model that both generates and edits (`kind:
  'generate'` + `supportsEdit`), so it can be both defaults without loading
  twice. Its VAE is new; the shipped file is madebyollin's texture-fix decoder
  finetune (same tensors, identical encoder), and `supersedes` flags installs
  with the stock file (see [ModelFileUpdates](ModelFileUpdates.md)). Canvases
  must be /32; the runtime picks its own flow schedule (no `--flow-shift`).
  Needs an sd.cpp build from 2026-09-20 or newer.
- FLUX.1 Schnell: 8 steps because 4 leaves distillation noise; 1024 native;
  cfg 1. T5-XXL is a Q8_0 GGUF because sd.cpp's CPU and Vulkan backends segfault
  on the fp8 safetensors.
- Chroma1-HD: no CLIP-L; real CFG, so its negative prompt applies; dpm++2m/beta
  at 20 steps matched 26 euler steps for about 17% less time.
- Chroma1-Flash: the model card's heun / 8 steps / CFG 1 recipe.
- FLUX.2 klein 4B: a different VAE from FLUX.1 (never dedupe it); Q8_0 default
  because small models lose more to 4-bit; cfg pinned to 1.
- Video rows: `supportsI2V` is always explicit because a T2V checkpoint silently
  discards `init_image` in sd.cpp. Wan rows share the 4n+1 frame grid capped at
  81 (the 5 s @ 16 fps training ceiling); LTX uses 8n+1 up to 257 at /32;
  MiniMax-H3 generates video and audio (two VAEs, a Qwen3-VL-32B `--llm`) on a
  17k+5 frame grid fixed at 24 fps, defaulting to 124 frames (about 5.2 s) with a
  345 ceiling. Its Turbo LoRA was trained on the full checkpoint.
- Every row's defaults sit on its own grid, so a default request logs no adjustment.

User-facing text (labels, blurbs, quant labels, prompt guides, license notes)
had its em-dashes replaced during the port; no other data changed (verified by a
field-by-field diff against the legacy table).
