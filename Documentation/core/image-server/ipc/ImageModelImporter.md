# ImageModelImporter

`core/image-server/ipc/ImageModelImporter.js`

Imports a community image checkpoint the catalog does not list: from a direct file URL, a local file, or a HuggingFace model page through a recipe.

## Methods

- `new ImageModelImporter({ imageServerService, slot, catalog?, fetchSiblings?, pickPath? })`.
- `ImageModelImporter.promptProfiles()` `{ byBase: { sdxl, 'sd-1-5' } }` prompt-style choices for the import dialog.
- `pickFile(event)` `{ canceled: true }` or `{ canceled: false, filePath, bytes }`.
- `fromUrl(args, send)` builds the entry ([ImportedEntryBuilder](ImportedEntryBuilder.md); refusals send nothing), downloads the diffusion file through the slot, then for Anima refuses an all-in-one file ([AllInOneCheckpoint](AllInOneCheckpoint.md)), attaches companions ([ImportCompanions](ImportCompanions.md)), writes the import manifest and sends `done`. Refusals after the download send `error`.
- `fromFile(args, send)` refuses an all-in-one Anima source before copying, sends `start` and `file-start`, copies with `download { role, received, total }` progress ([FileCopyProgress](FileCopyProgress.md)), attaches companions, writes the manifest, sends `file-done` and `done`. Does not use the download slot.
- `fromRepo({ url }, send)` parses the page URL, lists the repo ([HfRepoSiblings](HfRepoSiblings.md)), resolves the recipe ([HfRepoRecipes](HfRepoRecipes.md)), downloads every role through the slot, writes the repo manifest; resolves `{ success, id, dir, resolved }`.
- Any throw is sent as `error` and resolved as a failure (`ImageDownloadSlot.reportingFailures`).
