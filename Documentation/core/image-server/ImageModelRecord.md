# ImageModelRecord

`core/image-server/ImageModelRecord.js`

Builds the installed-model record by reconciling a model directory's manifest
with its curated catalog row. Used by [ImageModelsScanner](ImageModelsScanner.md).

## Methods

- `ImageModelRecord.build({ id, dir, manifest, files, catalogEntry, catalogList })`
  returns `{ id, name, label, dir, family, kind, supportsI2V, supportsEdit,
  files, minVramBytes, defaults, constraints, protocol, compatibleRuntimes,
  launchArgs, licenseNote, fileUpdates, manifest }`:
  - `label`, `family`, `constraints`, `protocol`, `compatibleRuntimes`,
    `launchArgs`, `licenseNote`: catalog value, else manifest value, else
    `id` / `null` / `null` / `sd-cpp-http` / `DEFAULT_RUNTIMES` / `[]` / `null`.
  - `minVramBytes` from the catalog only.
  - `defaults` from `layerDefaults`.
  - `compatibleRuntimes` passes through `withRuntimeAliases`.
  - `supportsI2V` only for video (`undefined` otherwise); `supportsEdit` is
    `true` for edit, `false` for video, else `resolveSupportsEdit`.
  - `fileUpdates` from [ModelFileUpdates](models/ModelFileUpdates.md) against
    `catalogList` (`[]` on any error).
- `layerDefaults(catalogEntry, manifest)`: catalog defaults underneath, manifest
  defaults on top, key by key; `null` when neither has any.
- `resolveKind({ catalogEntry, manifest, family })`: a stored `generate`,
  `edit` or `video` (manifest, then catalog) wins; else video and edit families
  map to their kind; else `generate`.
- `resolveSupportsI2V({ catalogEntry, manifest, id })`: catalog boolean, then
  manifest boolean, then an id containing `i2v`, `ti2v` or `flf2v` as a word.
- `resolveSupportsEdit({ catalogEntry, manifest })`: catalog boolean, then
  manifest boolean, else `false`.
- `withRuntimeAliases(ids)` adds `sd-cpp-luma` after `sd-cpp-cuda12`, deduped.
- Statics: `DEFAULT_PROTOCOL`, `DEFAULT_RUNTIMES`, `RUNTIME_ALIASES`, `KINDS`,
  `EDIT_FAMILIES`, `VIDEO_FAMILIES`, `I2V_ID`.

## Why

- Defaults: the manifest starts as a copy of the catalog row but is also where
  user edits land (attached LoRAs, the distilled preset). If the catalog won,
  those edits would vanish from the setup UI and from generation, since the
  routers read this same object.
- Kind is explicit and stored (set at install time or by the "move" action);
  the family guess only covers installs that predate the field.
- supportsI2V defaults to false: sd.cpp silently discards `init_image` on
  text-to-video weights, so a wrong `true` produces a clip unrelated to the
  source image, while a wrong `false` is a clear error the user fixes with
  `"supportsI2V": true` in manifest.json.
- supportsEdit covers unified generate+edit weights (Qwen-Image 2.1) that stay
  kind `generate` but are offered as the edit default too.
- The LumaByte sd.cpp build is upstream's CUDA 12 build with a patch stack, so
  every model that runs on `sd-cpp-cuda12` runs on it.
