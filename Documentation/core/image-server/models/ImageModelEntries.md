# ImageModelEntries

`core/image-server/models/ImageModelEntries.js`

Data-only class holding the curated image and video model rows. Read it
through [ImageModelCatalog](ImageModelCatalog.md).

## Members

- `ImageModelEntries.ENTRIES`: Z-Image Turbo, Qwen-Image-Edit 2509, Qwen-Image-Edit 2511,
  Qwen-Image 2.1, Qwen-Image 2.1 Turbo, SD 1.5, SDXL base, Sprite Shaper XL, FLUX.1 Schnell,
  Chroma1-HD, Chroma1-Flash, FLUX.2 klein 4B, MOSS-Image (images), then Wan 2.2 T2V, Wan 2.2
  I2V, AniSora V3.2, LTX-Video 2B and MiniMax-H3 (video).
- Shared companions `FLUX_VAE`, `T5XXL_Q8`, `WAN_VAE`, `UMT5_Q8`,
  `QWEN_21_VAE`, `QWEN3_VL_8B_LLM`, `QWEN3_VL_8B_VISION`, the shared
  `QWEN_21_PROMPT_GUIDE`, plus
  `WAN_VIDEO_DEFAULTS` and `WAN_CONSTRAINTS`. Rows copy the file and default
  objects (spread), so one row cannot mutate another; `WAN_CONSTRAINTS` is
  shared, as in legacy. `WAN_VIDEO_DEFAULTS` is 832x480, 20 steps, cfg 3.5,
  `euler`, 33 frames at 16 fps, flow shift 3: the official Wan 2.2 I2V config
  runs 40 steps at cfg 3.5, 10 burns out (glow, rainbow fringes, long clips
  collapsing to white) and 14 is still off, while 20 renders clean; the
  official I2V shift of 5 gave worse motion in the same same-seed AniSora test
  (2026-10-22), so 3 stays. The shared `negativePrompt` carries the official Wan
  2.2 negative prompt's content (overexposed, static, blurry details, ...) plus
  watermark and text terms for AniSora; it was a clear improvement on the same
  20-step clip.

## Row shape

`{ id, label, blurb, family, kind: 'generate'|'edit'|'video', supportsEdit?,
supportsI2V?, licenseNote?, files: { <role>: { role, repo, file, url,
approxBytes, loaderFlag?, quants?, supersedes?, updateNote? } }, minVramBytes,
defaults: { width, height, steps, cfgScale, sampler, scheduler?,
negativePrompt?, promptGuide?, fixedSigmas?, cacheMode?, cacheOption?, videoFrames?, fps?, flowShift? }, constraints?,
launchArgs, protocol: 'sd-cpp-http'|'sd-cpp-video', compatibleRuntimes,
preferredRuntimes?, sageAttention?, recommendedLora? }`. The last three are
launch and install preferences a row earned by measurement: a drop-in runtime
to use when installed ([PreferredImageRuntime](../service/PreferredImageRuntime.md)),
sd.cpp's native SageAttention ([SageAttentionPolicy](../service/SageAttentionPolicy.md)),
and a speed LoRA ([ImageLoraEntries](ImageLoraEntries.md) id) that
[CatalogModelInstaller](../ipc/CatalogModelInstaller.md) attaches at install.
MiniMax-H3 sets all three (2026-10-22: the LumaByte build decodes its video in
20 s instead of 94 s per 124 frames, SageAttention takes a step from 7.7 s to
4.5 s on an RTX 5090, and the Turbo LoRA renders in 8 steps instead of 20).

Roles map to sd-server flags in the launch planner: `diffusion`, `vae`, `llm`,
`clip_l`, `t5xxl`, `vision` (`--llm_vision`), `highNoise`
(`--high-noise-diffusion-model`), `audioVae` (`--audio-vae`), `tokenizer`
(`--tokenizer`, the one role that is a `.json`, not weights). `quants` must have
exactly one `default` equal to the top-level file and url. `recVramBytes` is the
comfortable GPU-resident size with the encoders on the CPU.

## Why (per row)

- Qwen-Image-Edit 2509: Qwen k-quants render solid black (sd.cpp #1385), so the
  safe Q4_0 / Q6_K / Q8_0 are recommended. `--offload-to-cpu` streams weights
  from RAM and was measured both fastest and the only OOM-proof option at 1 MP.
  The mmproj vision tower is required for references.
- Qwen-Image-Edit 2511: 2509's successor with the same companions (unsloth
  GGUFs, same quant caveat), less image drift between edits and better
  multi-person consistency. sd.cpp needs `--model-args
  qwen_image_zero_cond_t=true` for it or editing quality "degrades
  significantly" (docs/qwen_image_edit.md); the official ComfyUI template runs
  shift 3.1 at cfg 4.0 (Qwen 40 steps, Comfy 20), hence the row's defaults.
- Qwen-Image 2.1: one 7B model that both generates and edits (`kind:
  'generate'` + `supportsEdit`), so it can be both defaults without loading
  twice. Its VAE is new; the shipped file is madebyollin's texture-fix decoder
  finetune (same tensors, identical encoder), and `supersedes` flags installs
  with the stock file (see [ModelFileUpdates](ModelFileUpdates.md)). Canvases
  must be /32; the runtime picks its own flow schedule (no `--flow-shift`).
  Needs an sd.cpp build from 2026-09-20 or newer.
- Qwen-Image 2.1 Turbo: Qwen's official 8-step distill, same architecture and
  companions as the base (each row still downloads into its own folder). Quants
  are unsloth's (leejet has no Turbo repo; the card documents sd-cli use).
  `fixedSigmas` is the checkpoint's `sample_sigmas`, run unshifted because its
  scheduler has shift 1.0 and no dynamic shifting; cfg 1 (cfg 3 blows highlights
  per community tests). Below Q4_K_M unsloth reports visible drift at 8 steps.
- FLUX.1 Schnell: 8 steps because 4 leaves distillation noise; 1024 native;
  cfg 1. T5-XXL is a Q8_0 GGUF because sd.cpp's CPU and Vulkan backends segfault
  on the fp8 safetensors.
- Chroma1-HD: no CLIP-L; real CFG, so its negative prompt applies; dpm++2m/beta
  at 20 steps matched 26 euler steps for about 17% less time.
- Chroma1-Flash: the model card's heun / 8 steps / CFG 1 recipe.
- FLUX.2 klein 4B: a different VAE from FLUX.1 (never dedupe it); Q8_0 default
  because small models lose more to 4-bit; cfg pinned to 1.
- MOSS-Image: OpenMOSS's 5B DiT with a Qwen3.5-9B `--llm`, the FLUX.2 VAE and
  an external `tokenizer.json` (`--tokenizer`), since Qwen3.5's vocabulary is not
  the Qwen tokenizer sd.cpp embeds. The diffusion file is Comfy-Org's int8
  repack loaded with `--diffusion-model`: the community GGUFs keep split Q/K/V
  tensors sd.cpp cannot load yet (#2158). sd.cpp applies the model's shift 5 and
  the layer-22 skip on the negative branch itself, so the row sets no scheduler
  or shift. Upstream recommends 50 steps at cfg 3; on an RTX 5090 at 1024x1024
  (CUDA, int8) 28 steps with `cacheMode: 'easycache'` (13 of 28 steps skipped)
  sampled in 12 s versus 36 s for 50 plain steps with no visible loss in text,
  skin or hair; Vulkan runs the same row at about half that speed. Below 20
  steps dpm++2m over-sharpens lettering. Real CFG, so the short negative applies.
  Canvases are /16. Needs an sd.cpp build from 2026-10-17 (master-973) or newer.
- Video rows: `supportsI2V` is always explicit because a T2V checkpoint silently
  discards `init_image` in sd.cpp. Wan rows share the 4n+1 frame grid capped at
  81 (the 5 s @ 16 fps training ceiling); LTX uses 8n+1 up to 257 at /32;
  MiniMax-H3 generates video and audio (two VAEs, a Qwen3-VL-32B `--llm`) on a
  17k+5 frame grid fixed at 24 fps with a 345 ceiling. Its canvas is the model
  card's native 768p: 1344x768 (16:9, 1.03 MP), which
  [VideoFrameFit](../video/VideoFrameFit.md) refits by area for other aspects
  (a portrait source renders at 896x1152). sd.cpp's own example of 864x480 is
  below native, and same-seed I2V tests (2026-10-22, Turbo 8 steps) at that area
  came out crawling and deep-fried with broken audio at every clip length, while
  768x992 was passable and 896x1152 clean; the frame count made no difference,
  so time is saved by shortening the clip, not the canvas. The default is 90
  frames (3.75 s): at that area with the Turbo LoRA on an RTX 5090 (LumaByte
  build) a clip took 89 s at 56 frames, 114 s at 73, 138 s at 90 and 268 s at
  124, sampling growing linearly to 90 and then jumping, so 90 is the knee. Its
  Turbo LoRA was trained on the full checkpoint.
- Every row's defaults sit on its own grid, so a default request logs no adjustment.

User-facing text (labels, blurbs, quant labels, prompt guides, license notes)
had its em-dashes replaced during the port; no other data changed (verified by a
field-by-field diff against the legacy table).
