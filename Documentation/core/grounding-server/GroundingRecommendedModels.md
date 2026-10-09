# GroundingRecommendedModels

`core/grounding-server/GroundingRecommendedModels.js`

The recommended grounding models (Apache-2.0) and their one-at-a-time download.

## Methods

- `new GroundingRecommendedModels({ getModelsRoot, createModelDownload })`.
- `GroundingRecommendedModels.find(id)` a row or null.
- `pathsFor(rec)` `{ dir, model, mmproj }` under
  `<models root>/grounding/<owner>__<repo>`.
- `view()` each row plus `installed` (both files on disk) and `path` (the
  weights when installed, else null).
- `downloadState()` a copy of `{ id, file, received, total, done }` while a
  download runs, else null.
- `async download(id, onEvent, select)`: refuses `Unknown grounding model: <id>`
  and `A grounding model download is already running.`; fetches the projector,
  then the weights, from `https://huggingface.co/<repo>/resolve/main/<file>`,
  skipping files already present; a transfer that does not succeed returns
  `{ success: false, canceled: true }`; on success calls
  `select({ modelPath, mmprojPath })`, emits `{ type: 'done', id }` and returns
  the selection result. Transfer events reach `onEvent` as
  `{ type, file, ...payload }`. A throw becomes `{ success: false, error }`.
- `cancel()` cancels the running transfer.
- Statics: `RECOMMENDED` (Holo 3.1 9B Q6_K, 8.3 GB; Holo 3.1 4B Q6_K, 4.7 GB,
  each with an f16 projector), `SUBDIR`, `HF_BASE`.

## Why

Holo-3.1-9B tied for best in the calibration bench at the lowest latency; the
4B is the small-card option.
