# CivitaiMetaConsensus

`core/image-server/civitai/CivitaiMetaConsensus.js`

Reads the generation parameters CivitAI's sample images carry and answers the settings most of them agree on: medians for the numbers, the most common label for the rest.

## Methods

- `CivitaiMetaConsensus.consensus(metas, { minSamples = 3 })` over the `meta` objects of [CivitaiClient](CivitaiClient.md)`.listImages` items. Resolves `{ samples, defaults, samplerExact, evidence }` or `null` when fewer than `minSamples` images are objects, or when no key is readable. `defaults` holds only what was learned: `steps` (median of 1..150), `cfgScale` (median of 0..30, rounded to a half), `sampler` and `scheduler` (the most common `sampler` label and `Schedule type` / `scheduler` word, translated by [CivitaiSamplerMap](CivitaiSamplerMap.md)), `width` and `height` (the most common size), `negativePrompt` (the most common text, only when at least two images share it after whitespace folding). `samplerExact` is the translation's exactness (null without a sampler). `evidence` carries the counts and labels behind each key.
- `median(values)` and `mode(values, minCount = 1)` answer `{ value, count }`; `sizeOf(meta)` `"WxH"` from `width` / `height` numbers or a `Size` string within 256..4096, else null.

## Why

Uploaders' metadata is noisy (hires passes, odd sizes, half the keys missing), so each key is judged on its own count and nothing is forced. A median resists one 150-step outlier; the mode picks the sampler a community actually uses with the model, which is often better guidance than the base template. `clipSkip` is counted in the evidence but not applied: the runtime has no clip-skip control yet.
