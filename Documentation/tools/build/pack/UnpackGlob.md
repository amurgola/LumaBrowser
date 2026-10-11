# UnpackGlob

`tools/build/pack/UnpackGlob.js`

Combines `build.asarUnpack` patterns into one brace glob for `@electron/asar`'s
repack. Every pattern is anchored with `**/` because the repack matches ABSOLUTE
crawl paths (1.7.8 shipped with almost nothing unpacked).

minimatch's `**` never crosses a dot folder, so the repack must not run under a
path that has one (see [DistributableExtensionPruner](DistributableExtensionPruner.md)'s work dir).

## Methods

- `UnpackGlob.build(patterns)`: a brace glob, the single pattern, or null.
