# RipgrepBinary

`core/shell/RipgrepBinary.js`

Locates the packaged ripgrep binary for this platform, once.

## Methods

- `RipgrepBinary.path()` returns the absolute path of `rg`/`rg.exe` from `@vscode/ripgrep-<platform>-<arch>`, or
  `null` when this platform has no build. Cached after the first call.
- `RipgrepBinary.available()` is `!!path()`.
- `RipgrepBinary.reset()` clears the cache (tests).

## Why

It resolves through the platform package directly because `@vscode/ripgrep`'s entry point is ESM and cannot be
`require()`d from this CommonJS codebase. In a packaged build the resolved path is inside `app.asar`; Electron can read
through the archive but the OS cannot execute from it (spawn fails with ENOENT on a file that demonstrably reads).
`build.asarUnpack` puts the real file in `app.asar.unpacked`, and this rewrites the path when that copy exists. Dev and
unpacked builds never contain the segment.
