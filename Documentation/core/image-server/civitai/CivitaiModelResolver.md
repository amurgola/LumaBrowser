# CivitaiModelResolver

`core/image-server/civitai/CivitaiModelResolver.js`

Turns a CivitAI model (a page URL, a download URL, or ids) into the import entry [ImageModelImporter](../ipc/ImageModelImporter.md) downloads: reads the model and version from the API, maps the base to an import base and profile, picks the model file, and records the CivitAI ids, hashes, trigger words and licence terms on the entry. Nothing here touches the disk.

## Methods

- `new CivitaiModelResolver({ client?, now? })`; `client` is a [CivitaiClient](CivitaiClient.md), `now` a clock seam.
- `CivitaiModelResolver.parseUrl(url)` `{ modelId, versionId }` for `civitai.com/models/<id>[/slug][?modelVersionId=<id>]` (version null when absent) or `{ modelId: null, versionId }` for `civitai.com/api/download/models/<id>`; `null` for anything else.
- `resolve({ url?, modelId?, versionId?, fileId? })` resolves `{ model, version, file, map, entry }` or `{ error }`. Explicit ids win over the URL's; with only a version id the model is found through `getVersion`. The version defaults to the model's newest (`modelVersions[0]`), the file to the version's primary model file. Refusals: `URL_HINT` (no usable URL or id), `CivitAI model <id> has no version <id>.` / `has no published versions.`, `NOT_A_CHECKPOINT(type)` (a LoRA is told it belongs in the LoRA library), the [CivitaiBaseMap](CivitaiBaseMap.md) `note` for an unsupported base, `CivitAI version <id> has no downloadable model file.`, an [ImportedEntryBuilder](../ipc/ImportedEntryBuilder.md) refusal (a single-file Flux safetensors), or `Could not read the CivitAI model: <message>` for an API failure.
- `ids({ url?, modelId?, versionId? })` `{ modelId, versionId }` or `{ error }` (the first step of `resolve`, for callers that read a model without the install refusals); `versionOf(model, versionId)` the version with that id, else the newest, else null.
- `pickFile(version, fileId?)` a requested id must be one of the version's `Model` files (else null); otherwise the primary, else the first model file.
- `buildEntry({ model, version, file, map, now })` `ImportedEntryBuilder.build` with `fileName: file.name` (the download URL does not end in it), `promptStyle: map.profile`, `defaults: map.recipe`, `kind: map.kind`, then `family` from the map (Chroma), `licenseNote` from the creator's permission flags, and `civitai` from `origin`.
- `displayName(model, version)` `"<model> <version>"`, without repeating a version name the model name already carries.
- `bytesOf(file)` `sizeKB * 1024` only when the product is an integer (CivitAI lists bytes / 1024, so a real listing is exact; a rounded one is not trusted as an expected size). `expectations(file)` `{ expectedSize?, expectedSha256? }` for the download.
- `origin({ model, version, file, now })` `{ modelId, versionId, fileId, modelName, versionName, type, baseModel, fileName, sha256, blake3, trainedWords, nsfw, creator, pageUrl, fetchedAt }` (hashes lower-cased).
- `licenseNote(model)` one sentence from `allowCommercialUse` (`Image` selling generated images, `RentCivit` generation on CivitAI, `Rent` generation services, `Sell` selling the model, `None` or empty no commercial use), `allowNoCredit` and `allowDerivatives` / `allowDifferentLicense`; `null` when the listing carries none.

## Why

- The model read is always taken, even when a version id is known: the model carries the permission flags and the description the defaults derivation reads, and its `modelVersions` already include files, hashes and trigger words.
- The expected size and sha256 ride on the download so [ResumableDownload](../../shared/download/ResumableDownload.md) refuses a served size that differs before a byte lands and verifies the digest after, which is what makes a CivitAI install as trustworthy as a pinned Hub pull.
- The origin block is persisted in the manifest ([ImageManifestBuilder](../ipc/ImageManifestBuilder.md)) so a later "re-sync settings" or "newer version available" check has the ids and the hash to ask about, and adopted files can be matched by hash the same way.
