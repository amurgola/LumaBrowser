# CivitaiSearchView

`core/image-server/civitai/CivitaiSearchView.js`

Shapes CivitAI API objects into what the image setup card renders: a listing row per model with an install verdict per version, and the detail of one model (every version, the selected one's install facts, safe sample images and the model page as Markdown). Pure functions over API JSON; the renderer never sees raw CivitAI objects.

## Methods

- `CivitaiSearchView.page(page)` `{ items, nextCursor }` from a [CivitaiClient](CivitaiClient.md)`.listModels` page; models without versions are dropped.
- `row(model, { maxVersions = 6 })` `{ modelId, name, type, assetKind, installableType, nsfw, creator, tags (8), downloads, likes, thumbnail, pageUrl, versions }`.
- `version(version, model)` `{ versionId, name, baseModel, publishedAt, downloads, installable, reason, baseType, profile, kind, family, earlyAccess, file, trainedWords (10) }`. `installable` is true for a checkpoint on a [CivitaiBaseMap](CivitaiBaseMap.md) importable base with a model file; otherwise `reason` says why (a LoRA is pointed at the LoRA library, an unsupported base carries the map's note, a video base says it is video).
- `file(file)` `{ fileId, name, bytes, format, fp, size, sha256 }` (`bytes` exact from `sizeKB * 1024` when integral, else rounded).
- `thumbnail(model)` the first PG or PG-13 still image (`nsfwLevel` at most 3) of any version, resized through CivitAI's `width=320` URL segment; null when none. `images(version, limit = 4, width = 450)` the same selection for one version. `resize(url, width)`.
- `detail(model, { versionId?, fileId?, now? })` the row with up to 12 versions plus `versionId`, `version` (the selected verdict row; the newest when the id is absent or unknown), `fileId`, `label`, `defaults` and `licenseNote` (from the [CivitaiModelResolver](CivitaiModelResolver.md) entry when the version installs, else null), `trainedWords`, `images`, `description` and a `pageUrl` carrying the version. Null for a model without versions.
- `description(model, version)` the version notes ("### Version notes") then the model page ("### About this model") as Markdown through [HtmlToMarkdown](../../shared/content/HtmlToMarkdown.md), capped at 64 K characters with "(truncated)".

## Why

The setup card needs one stable shape it can paint without knowing CivitAI's schema, and the verdict belongs on the main side where the base map and the resolver live. Thumbnails and samples are filtered by CivitAI's own rating bits so an SFW listing never shows an adult sample even when the model is adult-tagged. The page comes down as Markdown so the renderer's escape-first [ReadmeRenderer](../../llm-server/ui/js/models/ReadmeRenderer.md) can draw it like a Hugging Face card; no CivitAI HTML reaches the DOM.
