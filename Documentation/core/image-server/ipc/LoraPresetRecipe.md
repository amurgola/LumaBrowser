# LoraPresetRecipe

`core/image-server/ipc/LoraPresetRecipe.js`

The sampling recipe a speed LoRA's distilled preset brings, applied onto a model's manifest defaults and removed again.

## Methods

- `LoraPresetRecipe.cleanLoras(loras)` named entries as `{ name, weight, highNoise? }` (weight defaults to 1.0 unless positive).
- `curatedPreset(loras, loraCatalog)` the preset of the first attached LoRA whose curated entry has a file with that stem, or null.
- `apply(defaults, preset)` snapshots the model's own `RECIPE_KEYS` once into `recipeBeforePreset` (a swap keeps the original), then sets `sigmaNodes` (or removes it), `steps` (default 8), `cfgScale` (default 1.0), `sampler` (default `euler`), `highNoiseSteps` / `highNoiseCfgScale` (or removes them), `distilledPreset: true`.
- `remove(defaults)` restores the snapshot when a preset was active and drops `distilledPreset`.
- `RECIPE_KEYS` steps, cfgScale, sampler, scheduler, sigmaNodes, highNoiseSteps, highNoiseCfgScale.

## Why

Without the snapshot a model that lost its turbo LoRA kept the turbo step count and rendered under-sampled from then on.
