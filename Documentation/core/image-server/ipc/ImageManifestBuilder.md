# ImageManifestBuilder

`core/image-server/ipc/ImageManifestBuilder.js`

Builds the `manifest.json` written beside a freshly installed image model in its three shapes.

## Methods

- `ImageManifestBuilder.forCatalog(entry, files, now?)` id, label, family, `kind` (or null), `supportsI2V` / `supportsEdit` / `constraints` when the entry has them, the files bag, defaults, protocol (default `sd-cpp-http`), compatibleRuntimes, `downloadedAt`.
- `forImport(entry, now?)` id, label, family, `kind` (default `generate`), `supportsEdit` / `constraints`, `imported: true`, `baseType`, `promptStyle`, the files bag, defaults, minVramBytes, launchArgs, licenseNote, protocol, compatibleRuntimes, `downloadedAt`, and `linkedFrom` when the weights are a link into another tool's library.
- `forRepo(entry, now?)` id, label, family, then the same install tail as an import (no import or category fields: the id is a real catalog id and the scanner inherits the rest).

## Why

Category, I2V, unified edit and the sampling grid are persisted so a model keeps them even if its catalog row is later edited or removed.
