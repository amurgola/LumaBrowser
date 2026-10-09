# CatalogModelInstaller

`core/image-server/ipc/CatalogModelInstaller.js`

Downloads a curated catalog image model, optionally at a chosen diffusion quant, and writes its manifest.

## Methods

- `new CatalogModelInstaller({ imageServerService, slot, catalog? })`.
- `install({ id, quant? }, send)` resolves `{ success: true, id, dir }`, `{ success: false, canceled: true }` or a failure. Refusals without an event: `A catalog model id is required.`, `Catalog entry "<id>" has no files.`, the unknown-quant error, and (busy) `An image model download is already in progress.`. Downloads every role into `<modelsDir>/<id>/`, writes `ImageManifestBuilder.forCatalog` quietly, sends `done { id, dir }`; a download failure sends `error`.
- `CatalogModelInstaller.downloadList(files, dir)` `[{ role, url, destPath }]` per role.
