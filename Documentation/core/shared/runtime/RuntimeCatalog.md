# RuntimeCatalog

`core/shared/runtime/RuntimeCatalog.js`

The accessor surface over a declarative `RUNTIMES` array, keyed by the host
platform. Each managed server keeps its own runtime data and wraps it in one of
these.

## Methods

- `new RuntimeCatalog(runtimes)` wraps the declarative array.
- `getCatalog()` returns the array as given.
- `getById(id)` returns the entry or `null`.
- `platformKey()` returns `` `${process.platform}-${process.arch}` ``, read live.
- `getAssetPattern(entry)` returns `entry.assetPatterns[platformKey()]` or `null`.
- `getRepo(entry)` returns `entry.repos[platformKey()]` if present, else
  `entry.repo`, else `null`.
- `getCompanionAssetPatterns(entry)` returns the host's companion regexes as an
  array (a single regex is wrapped), or `[]`.
- `getBinaryNames(entry)` returns `entry.binaryNames[process.platform]` (keyed by
  OS only, not arch), or `[]`.
- `fingerprint()` returns a 16-hex-char SHA-1 of the declaration, cached per
  instance after the first call.
- `RuntimeCatalog.hashDeclaration(value, length = 16)` is the hashing step,
  exposed so a subclass can fingerprint extra rows the same way.

## Why

Platform keying, asset and companion pattern lookup and binary resolution used
to be copied per server. One class keeps them identical across the LLM, image,
music and whisper servers and extension runtimes.

Per-platform `repos` exists because some upstreams ship no build for a platform
(llama.cpp has no Linux CUDA release), so that host pulls from a fork.

Companions are always an array so a runtime can ship several sidecars (for
example a cudart and a cublas split).

The fingerprint is stamped onto persisted runtimes-view snapshots, which are
rebuilt on mismatch. Without it, a catalog edit shipped in an update would keep
showing the view computed from the old catalog. Regexes are stringified before
hashing because `JSON.stringify` renders every regex as `{}`.

## Porting callers

Legacy callers spread the factory result (`{ ...makeCatalog(RUNTIMES), getById() {...} }`)
to override `getCatalog`, `getById` and `fingerprint` with registry-merged
versions. Spreading a class instance does not copy prototype methods, so those
callers must instead subclass `RuntimeCatalog` and call `super`. Destructured,
unbound calls (`const { getById } = catalog`) also no longer work. Callers that
just export the result (`module.exports = makeCatalog(RUNTIMES)`) become
`new RuntimeCatalog(RUNTIMES)`.
