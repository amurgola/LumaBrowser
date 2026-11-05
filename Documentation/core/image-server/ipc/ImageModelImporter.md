# ImageModelImporter

`core/image-server/ipc/ImageModelImporter.js`

Imports a community image checkpoint the catalog does not list: from a direct file URL, a local file, a HuggingFace model page through a recipe, or a CivitAI model through its API.

## Methods

- `new ImageModelImporter({ imageServerService, slot, catalog?, fetchSiblings?, pickPath?, civitai? })`. `fetchSiblings` defaults to `HfRepoSiblings.fetchListing`; the seam may answer a bare name list or the listing object. `civitai` is a [CivitaiModelResolver](../civitai/CivitaiModelResolver.md), built lazily on first use so a plain import never constructs the CivitAI client; `recipes` a [CivitaiRecipe](../civitai/CivitaiRecipe.md) (none means a CivitAI import keeps its base and profile defaults).
- `ImageModelImporter.promptProfiles()` `{ byBase: { sdxl, 'sd-1-5' } }` prompt-style choices for the import dialog.
- `pickFile(event)` `{ canceled: true }` or `{ canceled: false, filePath, bytes }`.
- `fromUrl(args, send)` builds the entry ([ImportedEntryBuilder](ImportedEntryBuilder.md); refusals send nothing), refuses a base whose companion set is not installed before anything downloads ([ImportCompanions](ImportCompanions.md)`.check`, no events), downloads the diffusion file through the slot, then for Anima refuses an all-in-one file ([AllInOneCheckpoint](AllInOneCheckpoint.md)), attaches companions ([ImportCompanions](ImportCompanions.md)), writes the import manifest and sends `done`. Refusals after the download send `error`.
- `fromFile(args, send)` refuses an all-in-one Anima source before copying, sends `start` and `file-start`, copies with `download { role, received, total }` progress ([FileCopyProgress](FileCopyProgress.md)), attaches companions, writes the manifest, sends `file-done` and `done`. Does not use the download slot.
- `fromRepo({ url }, send)` parses the page URL, lists the repo pinned to one commit ([HfRepoSiblings](HfRepoSiblings.md); a gated repo's access error is reported as `Could not read the HuggingFace repo ...`), resolves the recipe ([HfRepoRecipes](HfRepoRecipes.md)) with that listing so the downloads read the sha and carry their expected size and sha256, downloads every role through the slot, writes the repo manifest; resolves `{ success, id, dir, resolved }`.
- `fromCivitai({ url?, modelId?, versionId?, fileId? }, send)` resolves the model through the resolver (a refusal sends nothing), downloads the chosen file through the slot with the listing's `expectedSize` and `expectedSha256` so the verifier refuses a swapped or truncated file, then runs the same tail as `fromUrl` (Anima refusal, companions, import manifest with the `civitai` origin block, `done`); resolves `{ success, id, dir, civitai }`. With a `recipes` [CivitaiRecipe](../civitai/CivitaiRecipe.md), the defaults derivation starts beside the download and is applied (`CivitaiRecipe.apply`) after the companions and before the manifest; `recipe { id, stage: 'reading' | 'done' | 'failed', defaults?, sources?, warnings?, imageSamples?, error? }` events report it, and a failure leaves the base and profile defaults in place.
- `resolveCivitai(args)` the resolver's answer without downloading, for a preview before install.
- Any throw is sent as `error` and resolved as a failure (`ImageDownloadSlot.reportingFailures`).
