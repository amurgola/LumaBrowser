# PreferredImageRuntime

`core/image-server/service/PreferredImageRuntime.js`

Swaps the configured image runtime for one the model's catalog row prefers,
for one launch, when that runtime is installed and is a drop-in for the
configured one.

## Methods

- `PreferredImageRuntime.pick({ model, configured, runtimes })` returns
  `{ runtime, note }`. Walks `model.preferredRuntimes` in order: a preferred id
  that is the configured one stops the search; one that is not an alias of the
  configured id (`interchangeable`) is skipped; the first that is `installed`
  with a `binaryPath` in `runtimes` (the detector's rows) is returned with the
  note `runtime <preferred> preferred over <configured>`. Otherwise
  `{ runtime: configured, note: null }`.
- `PreferredImageRuntime.interchangeable(a, b)` is true when either id lists the
  other in [ImageModelRecord](../ImageModelRecord.md)`.RUNTIME_ALIASES`
  (upstream CUDA 12 and the LumaByte build).

## Why

MiniMax-H3's video decode on upstream sd.cpp spends about 80 s of one CPU core
per 124 frames in a per-element temporal blend; the luma-sdcpp tensor patch
removes it (94 s to 20 s measured 2026-10-22). The user's runtime setting stays
untouched: a Vulkan or CPU choice is never moved onto CUDA, and the swap is
visible in the launch line ([ImageLaunchLog](ImageLaunchLog.md)).
