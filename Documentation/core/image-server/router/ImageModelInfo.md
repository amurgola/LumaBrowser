# ImageModelInfo

`core/image-server/router/ImageModelInfo.js`

Side-effect-free facts about the configured image models for callers that must
size or word a request before it runs. Never starts a server; every method
resolves `null` when nothing is configured or anything fails.

## Methods

- `new ImageModelInfo({ imageServerService, models })`; `models` is an
  [ImageModelResolver](ImageModelResolver.md).
- `nativeSize(modelRef?)` resolves `{ modelId, width, height }` from the model's
  defaults over its family scaffold, 512 per missing side. `modelRef` null is the
  configured generation model.
- `frameSizes(modelRef?)` resolves `{ modelId, label, native, grid, frames }`:
  `native` falls back to 1024 per side, `grid` to 64, `frames` is
  [EditFrames](../EditFrames.md)`.listFrames({ native, grid })`. `modelRef` null
  is the edit default, then the generation default (as `edit_image` routes).
- `activePromptInfo(role = 'generate')` resolves
  `{ modelId, label, family, promptGuide, negativePrompt }` for the generation
  model, or for `'edit'` the edit default then the generation default.
  Missing guide or negative is `null`.
- `ImageModelInfo.labelOf(model)`: label, displayName, then id.
- `ImageModelInfo.gridOf(model, fallback)`: `constraints.dimensionMultiple` when above 1.

## Why

Sprite pipelines render at the model's sweet spot and downscale, so they ask
for the native size instead of guessing 512. The chat agent picks an edit frame
by name, never pixels, so the frames are resolved here for its tool doc and for
`edit_image`'s canvas. The prompt hint tells the agent whether to write booru
tags or prose and that a default negative is already applied.
