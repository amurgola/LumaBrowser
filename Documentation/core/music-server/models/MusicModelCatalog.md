# MusicModelCatalog

`core/music-server/models/MusicModelCatalog.js`

The music model catalog. Extends `MediaModelCatalog`. One entry today,
MiniMax-Music3, the first strong open-weights full-song generator.

## Methods

- `new MusicModelCatalog()` wraps `MusicModelCatalog.ENTRIES`.
- `list()`, `getById(id)`, `fingerprint()` (inherited).

## Entry shape

`{ id, label, blurb, kind: 'music', hfRepo, approxTotalBytes, arStageBytes,
ditStageBytes, minVramBytes, dualGpuOk, constraints: { maxPromptTokens,
maxAcousticFrames, sampleRate, maxDurationSec }, launchProfiles: { single, dual },
defaults: { maxNewTokens }, apiModelName, protocol, compatibleRuntimes, licenseNote }`.

## Why

- A music model is a whole HuggingFace repo snapshot that `sgl-omni serve`
  loads as a directory, so a row carries `hfRepo` and byte estimates instead of
  the image catalog's per-role `files` bag.
- `approxTotalBytes` (54 GiB) was measured from a completed snapshot (53.4 GB on
  disk, 2026-08-15); the repo is far bigger than the model card suggests.
  Serving only reads `qwen_7B/` (the AR backbone, about 17 GB bf16) plus
  `flowmatching_vae.pth` and `dav.pth` (about 10 GB, the fp32 DiT/DAV stage);
  `language_model/` and `transformer/` are dead weight but still download.
- VRAM facts: the two stages run as separate processes. With one visible GPU
  both colocate and need the whole stack plus KV on one card (a live run died
  with "minimum viable = 1.0000", live failure #4), hence `minVramBytes` 34 GiB
  as the colocated floor. With two GPUs the AR stage takes device 0 and DiT/DAV
  device 1 (a third GPU is ignored; tensor parallel is unsupported).
  `arStageBytes` 20 GiB = backbone 16.7 GB + KV pool + graphs; `ditStageBytes`
  13 GiB = VAE + DAV about 10 GB fp32 + activations.
- `launchProfiles` are extra `sgl-omni serve` args per placement, data-driven so
  live findings land here (users can append `core.musicServer.extraServeArgs`).
  `--mem-fraction-static` sizes the AR stage's sglang pool as a fraction of the
  AR card's total memory; the fp32 DiT/DAV process allocates outside it. Dual:
  0.8 (0.8 of a 24 GB card is a 19.2 GB pool over 16.7 GB of weights). Single:
  0.5, because the colocated DiT/DAV stage's 13 GB shares the card; 0.65 was live
  failure #4.
- `apiModelName` is only a fallback for the request's `model` field; the launch
  planner normally sends the exact `--model-path` string the server started with.

The blurb's and license note's em-dashes were replaced during the port
(user-facing text rule).
