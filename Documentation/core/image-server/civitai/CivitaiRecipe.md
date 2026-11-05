# CivitaiRecipe

`core/image-server/civitai/CivitaiRecipe.js`

Derives an imported CivitAI checkpoint's generation defaults from what CivitAI knows about it: the creator's description first, the consensus of the sample images second, the import base's template underneath.

## Methods

- `new CivitaiRecipe({ client?, reader?, sampleLimit = 60, nsfw = false })`; `client` a [CivitaiClient](CivitaiClient.md) for the sample images, `reader` a [CivitaiDescriptionReader](CivitaiDescriptionReader.md); either may be absent.
- `derive({ model, version, map, entry })` reads both sides in parallel (`listImages` for the version, sorted by reactions, `withMeta`, SFW only unless `nsfw`; the reader when `available`) and resolves `merge(...)`. Never rejects: a failing side becomes a warning.
- `CivitaiRecipe.merge({ images, description, map, entry, warnings })` resolves `{ defaults, sources, warnings, images, description, promptGuideAddendum }`. `defaults` is the patch for the entry (`APPLIED_KEYS`: steps, cfgScale, sampler, scheduler, width, height, negativePrompt), the description's value winning over the images' key by key, each key's origin in `sources`. A winning sampler without a scheduler drops the other layer's scheduler. Keys in `LOCKED_KEYS` for the base (`cfgScale` on flux and both Qwen bases, `steps` on qwen-image-edit) are never applied. Sizes snap to the entry's `constraints.dimensionMultiple` (default 8). A sampler stand-in (`samplerExact: false`) from the winning layer adds a warning naming the original label.
- `promptGuideAddendum(description, entry)` the trigger words (the description's, else the listing's `trainedWords`), the creator's positive prefix and note, as one line for the chat agent; null when none.
- `apply(entry, derived, now?)` lays the patch over `entry.defaults`, appends the addendum to `defaults.promptGuide`, and records `civitai.recipe { sources, warnings, imageSamples, description, derivedAt }` for the manifest.
- `snap(value, multiple)`.

## Why

- Precedence: the creator knows the recipe (Lightning at cfg 1.5, a Hyper build at 4 steps) and the description is where it is written; the sample images show what the community actually runs and fill the keys the creator left out; the base template covers the rest. Recording the source per key lets the setup card say where a number came from.
- Locked keys: Flux and Qwen model pages quote a guidance of 3.5 that is distilled guidance, not CFG; sd.cpp sets it per model and a real CFG above 1 fries the output, so those keys stay with the template whatever CivitAI says.
- The derivation runs while the file downloads ([ImageModelImporter](../ipc/ImageModelImporter.md)`.fromCivitai`), so a cold local model costs no wall-clock on a multi-gigabyte pull.
