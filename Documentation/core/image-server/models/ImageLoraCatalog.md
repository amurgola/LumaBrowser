# ImageLoraCatalog

`core/image-server/models/ImageLoraCatalog.js`

The curated downloadable LoRAs for the shared `<modelsDir>/loras` library,
offered per model family. Extends `MediaModelCatalog`
(`core/media-shared/MediaModelCatalog.js`); the rows live in `ImageLoraEntries`.

## Methods

- `new ImageLoraCatalog()` wraps `ImageLoraEntries.ENTRIES`.
- `list()` returns every entry; `getById(id)` returns one or `null`;
  `fingerprint()` is a stable 16-char hex hash of the table (inherited).
- `entryFiles(entry)` normalises both entry shapes to a file list: a pair entry's
  `files` (halves missing `file` or `url` dropped), or a single entry as
  `[{ file, url, approxBytes }]`. Missing input gives `[]`.

## Entry shape

`{ id, label, family, repo, blurb, weight, licenseNote }` plus either
`file` + `url` + `approxBytes` (single) or `files: [{ file, url, approxBytes, highNoise? }]`
(pair). Speed LoRAs carry `preset` (`steps`, `cfgScale`, `sampler`, optional
`sigmaNodes`, `highNoiseSteps`, `highNoiseCfgScale`); style LoRAs carry `trigger`
and no preset.

## Why

- `family` matches the model catalog's `family`, so the UI only offers a LoRA on
  models it was distilled against. `file` doubles as the installed-check key
  because a LoRA's trigger name is its filename minus `.safetensors`.
- Pair entries exist for Wan 2.2's two-expert design: one LoRA per expert,
  attached together, the high-noise half routed via `lora[].is_high_noise`.
- Speed presets are the community recipes that actually deliver the speedup.
  Viggle Qwen-Image 2.1 turbo (r128, the one Viggle's ComfyUI workflows use):
  6 steps, cfg 1, measured 6.5 s vs 15.3 s for 25 steps on a 5090; its
  `sigmaNodes` are the model card's schedule (see `FlowSchedule`). It ships with
  diffusers key names, so the download path repacks it (`LoraRepacker`).
  MiniMax-H3 Turbo: 8 steps, cfg 1; trained on the full (non-pruned) base, so on
  the pruned quant sd.cpp skips about 100 AdaLN tensor pairs. Wan 2.2 Lightning:
  4 steps on both experts at cfg 3.5, the recipe sd.cpp's docs/wan.md documents.
- Style LoRAs change what renders, not how fast, so sampling stays the model's
  own; `trigger` is surfaced by the attach UI and the model's prompt guide.

Labels and blurbs had their em-dashes replaced with ASCII punctuation during the
port (user-facing text rule).
