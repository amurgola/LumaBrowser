# AddonPackager

`tools/build/addons/AddonPackager.js`

`npm run build:extensions`: for each `distributable: true` extension, stages a
copy beside the output, obfuscates it with [AddonObfuscator](AddonObfuscator.md)
when it is also `private: true`, writes `meta.json` (`id`, `name`, `version`,
`description`, `private`, read by the LumaByte admin upload), zips it with
[AddonZipper](AddonZipper.md) to `dist/extensions/<id>.zip`, and writes
`dist/extensions/index.json`. The bytecode step removes the same extensions from
app.asar.

Add-ons are obfuscated at the source level, not compiled to bytecode, so one zip
runs on every platform and Electron version.

## Methods

- `new AddonPackager({ rootDir, outDir, obfuscator, zipper, log })`; `run()`
  resolves to the catalog entries; `AddonPackager.metadata(manifest, dir)`.
