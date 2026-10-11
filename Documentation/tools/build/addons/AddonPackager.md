# AddonPackager

`tools/build/addons/AddonPackager.js`

`npm run build:extensions`: for each `distributable: true` extension, stages a
copy beside the output, writes `meta.json` (`id`, `name`, `version`,
`description`, `private`, read by the LumaByte admin upload), zips it with
[AddonZipper](AddonZipper.md) to `dist/extensions/<id>.zip`, and writes
`dist/extensions/index.json`. [DistributableExtensionPruner](../pack/DistributableExtensionPruner.md)
removes the same extensions from app.asar.

Add-ons ship as plain source, so one zip runs on every platform and Electron
version. `private` is always `false`: the manifest flag is gone, but the
LumaByte admin upload still parses the field.

## Methods

- `new AddonPackager({ rootDir, outDir, zipper, log })`; `run()`
  resolves to the catalog entries; `AddonPackager.metadata(manifest, dir)`.
