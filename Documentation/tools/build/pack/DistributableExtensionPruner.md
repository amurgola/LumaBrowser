# DistributableExtensionPruner

`tools/build/pack/DistributableExtensionPruner.js`

The electron-builder `afterPack` step (`scripts/after-pack.js`). Distributable
extensions ship as add-on zips ([AddonPackager](../addons/AddonPackager.md)),
never inside the app, so this removes every extension whose manifest has
`distributable: true` from the packed app.asar. The manifests are read from the
archive itself (copied out with [ExtensionManifests](../shared/ExtensionManifests.md)),
so a new add-on only needs the flag, no package.json edit.

When there is something to remove it extracts the archive into a work folder
beside the build output (not %TEMP%, where Defender quarantines some sources;
tmp when that parent has a dot folder, because the unpack glob cannot cross
one), deletes the folders, and repacks with `build.asarUnpack` plus whatever
electron-builder had already unpacked ([UnpackedSnapshot](UnpackedSnapshot.md),
combined by [UnpackGlob](UnpackGlob.md)). An archive without distributables is
left untouched. A missing app.asar ([AppAsarLocator](AppAsarLocator.md)) throws.

## Methods

- `new DistributableExtensionPruner({ asar, unpackPatterns, log })`: `asar` is
  `@electron/asar`; `unpackPatterns` defaults to package.json `build.asarUnpack`.
- `prune(context)`: `context` is electron-builder's afterPack context
  (`{ appOutDir, packager }`); resolves to the sorted folder names removed.
- `DistributableExtensionPruner.readUnpackPatterns(packageJsonPath)`: `[]` when
  unreadable.
