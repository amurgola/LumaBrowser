# ImageFamilyScaffold

`core/image-server/router/ImageFamilyScaffold.js`

Per-family prompt and sampling scaffolding layered under a model's own
defaults, plus the quality-tag wrapper applied to the prompt.

## Methods

- `ImageFamilyScaffold.merge(model)` returns the effective defaults: the
  family's entry, then `model.defaults` on top (the model always wins), then
  the distilled-checkpoint recipes forced on top. `null` gives `{}`.
- `ImageFamilyScaffold.isQwenRapidAio(model)`: a `qwen-image-edit` model whose
  id, label, displayName or file names mention Rapid AIO. Forced to
  `RAPID_AIO_RECIPE` (4 steps, cfg 1, euler_a, sgm_uniform).
- `ImageFamilyScaffold.isAnimaDistilled(model)`: an `anima` model whose names
  mention an 8/12-step checkpoint (MiaoMiao Anima 8-Step). Forced to
  `ANIMA_DISTILLED_RECIPE` (12 steps, cfg 1, euler, sgm_uniform).
- `ImageFamilyScaffold.buildPrompt(prompt, md)` trims the prompt and adds
  `md.promptPrefix` / `md.promptSuffix` only when the prompt does not already
  contain them (case-insensitive).
- `ImageFamilyScaffold.fromProfile(id)` projects an
  [ImagePromptProfiles](../prompt/ImagePromptProfiles.md) profile into
  `{ promptPrefix, negativePrompt, promptGuide }` (empty values omitted).
- `ImageFamilyScaffold.FAMILIES`: `qwen-image-edit`, `qwen-image-2`, `anima`,
  `sdxl`, `sd-1-5` (the last two from the family fallback profiles).

## Why

Model-card cues (Anima's quality tags, Phr00t's Rapid-AIO recipe, Qwen-Image
2.1's natural-language guide) are applied automatically so neither the chat
model nor roleplay has to know each model's quirks. They only fill gaps, except
the two distilled recipes: imported manifests commonly inherit the generic
30-step / CFG-4 recipe, which throws away the point of a distilled checkpoint.

sd.cpp has no `beta` scheduler (it silently falls back to a default that warbles
on flat regions), so the Qwen edit scaffold uses `sgm_uniform`. Nothing here
filters content; `safe` is never forced.
