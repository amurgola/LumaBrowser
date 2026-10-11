# UnpackedSnapshot

`tools/build/pack/UnpackedSnapshot.js`

Turns what electron-builder put in `app.asar.unpacked` into unpack patterns
(`node_modules/<pkg>/**` per package, exact paths otherwise) so the
[DistributableExtensionPruner](DistributableExtensionPruner.md) repack keeps them. electron-builder auto-unpacks the native modules it detects
(better-sqlite3, @napi-rs/canvas) beyond `build.asarUnpack`.

## Methods

- `UnpackedSnapshot.patterns(unpackedDir)`
