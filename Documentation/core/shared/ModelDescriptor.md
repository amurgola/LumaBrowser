# ModelDescriptor

`core/shared/ModelDescriptor.js`

Normalises LLM scan entries and image installed/catalog entries into one
HTML-free, host-independent `ModelDescriptor` shape.

## Methods

- `ModelDescriptor.toLlmDescriptor(m)` takes one LLM scan model (after
  `decorateScan`, so `nameKey`/`displayName` exist). Tags: GGUF architecture,
  `MTP`, shard count (`n/m shards`, `ok` when complete, `common` with
  ` · incomplete` otherwise), `mmproj`, `MTP head`, and `mmproj-only` /
  `mtp-only` kinds. Features: `rename` always, `ctxfit` for parsed weights
  with a block count, `fit` when weights exist, `shards` when sharded.
  `originalFileName` is set only when the display name differs from `nameKey`.
- `ModelDescriptor.toImageInstalledDescriptor(m)` takes an installed image
  model. Size sums `files[*].bytes`; files are keys with a `path` or `file`.
  Tags: kind (`generation`, `generation + edit` when `supportsEdit`, `edit`,
  `video` in accent), `NC` for a license note, `imported`. Features `pin`,
  `move`, `remove`. `meta: { kind, licenseNote }`.
- `ModelDescriptor.toImageCatalogDescriptor(entry, installed?)` takes a
  downloadable catalog entry. Size sums base `files[*].approxBytes`. Features:
  `download`, `blurb` when present, `quant` when the diffusion file offers more
  than one quant. `meta: { kind, blurb, licenseNote, installed }`, where
  `installed` is true when the id appears in the `installed` array.

All descriptors carry `key, domain, section, name, originalFileName,
sizeBytes, info: { arch, layers, nativeCtx, fileType, path, files }, tags:
[{ label, variant, group }], interfaces, features: [{ id, kind }], raw`.
Tag `variant` is one of `accent | warn | ok | muted | common`; `group` is
`kind | license | origin | feature | arch | shard`. Feature `kind` is `action`
(a button) or `block` (an expandable body). Image kinds are normalised to
`generate | edit | video`.

## Why

The LLM "Models Directory" and the Image "Image Models" lists are the same list
with domain extras. Both IPC layers (`core/llm-server` and `core/image-server`
ipc-handlers) emit this shape and the shared renderer
(`core/llm-server/ui/js/model-list.js`) reads it, so they must agree.

This tier holds only facts true on any machine. The renderer overlays live
host/UI state: the GPU fit matrix and fit-test results, runtime-install
badges, the "default" pin badge, quant-vs-VRAM notes, and download/fit-test
progress. `raw` carries the original object so the renderer's existing builders
keep working against `descriptor.raw`.
