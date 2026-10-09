# CompanionAssets

`core/shared/runtime/install/CompanionAssets.js`

Downloads and extracts a runtime's companion archives on top of the main install.

## Methods

- `new CompanionAssets({ userAgent, http, extractor })`.
- `install({ specs, release, entry, runtimesRoot, managedDir, emit })` resolves
  one outcome per spec, in order:
  - a `RegExp` picks an asset of the same release: `{ name, url, size, sha256, status: 'installed' }`,
    or `{ pattern, name: null, status: 'no-match' }` (not fatal)
  - `{ url, name?, extractGlobs? }` downloads a fixed URL; `name` defaults to
    the URL's base name, `size` is `null`, `extractGlobs` limits extraction
  - anything else: `{ pattern, name: null, status: 'invalid-spec' }`
  Events `resolved`, `download`, `extract` carry `kind: 'companion'`.

## Why

CUDA 12 ships cudart as a separate zip; without those DLLs beside the binary
the CUDA backend silently falls back to CPU. Fixed URLs cover deps a release
does not carry (NCCL from NVIDIA's CDN for the janhq Linux CUDA builds).
