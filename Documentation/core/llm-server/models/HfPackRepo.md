# HfPackRepo

`core/llm-server/models/HfPackRepo.js`

Describes a Hub repo of single-file model packs (a framework's own format, such as `.basalt`).

## Methods

- `HfPackRepo.fetchInfo(repoId, { extension, signal?, revision? })` resolves
  `{ repoId, author, name, gated, variants }`. The repo is pinned to one commit
  ([HfPinnedRepo](HfPinnedRepo.md)); a bad id throws `HF_BAD_ID`, a missing repo `HF_NOT_FOUND`.
- `HfPackRepo.variants(pinned, extension)`: every file with that extension (case does not matter, any folder) as
  `{ quant, file, url, approxBytes, sha256, sharded: false }`, smallest first. `quant` is the file stem; `url` is
  the resolve URL at the pinned sha.

## Why

A variant has the shape of a single-file GGUF variant, so the search modal's picker and the existing download
path (`downloadModel({ url, filename, totalBytes })`, verified against the pinned size and digest) take it
unchanged. A pack has no GGUF header, so there are no parameter, context or fit facts: the size is what the
listing can say, and the packs come smallest first because nothing says which one fits.
