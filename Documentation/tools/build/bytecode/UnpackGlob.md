# UnpackGlob

`tools/build/bytecode/UnpackGlob.js`

Combines `build.asarUnpack` patterns into one brace glob for `@electron/asar`'s
repack. Every pattern is anchored with `**/` because the repack matches ABSOLUTE
crawl paths (1.7.8 shipped with almost nothing unpacked), and each `.js` pattern
also unpacks its `.jsc` sibling.

minimatch's `**` never crosses a dot folder, so the repack must not run under a
path that has one (see BytecodeCompiler's work dir).

## Methods

- `UnpackGlob.build(patterns)`: a brace glob, the single pattern, or null.
