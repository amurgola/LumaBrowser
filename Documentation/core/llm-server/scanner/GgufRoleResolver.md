# GgufRoleResolver

`core/llm-server/scanner/GgufRoleResolver.js`

Resolves each scanned GGUF file's role before grouping: the parsed header
(through the header cache) decides first; the file name is consulted only when
the header is unavailable or undecided.

## Methods

- `GgufRoleResolver.resolve(files, headerCache, concurrency = 4)` (async) takes
  `ModelDirWalker` ggufs and resolves `Map path -> { role, roleSource,
  roleReason, nameHint, header }`. `roleSource` is `'header'` or `'filename'`;
  `header` is the successful parse result or null; `nameHint` is
  `GgufFileName.roleHint(name)` kept as a secondary signal (drafts).
- `GgufRoleResolver.isTarget(file)` single files and first shards only; shard
  2..n carries no architecture key and follows its group.
- `GgufRoleResolver.resolveOne(file, headerCache)`, `GgufRoleResolver.fromFilename(file, header)`.
- `CONCURRENCY`.

## Precedence

1. A parse that succeeded with a role from [GgufRoleTable](../GgufRoleTable.md)
   is decisive: an `mmproj-` named decoder stays `main`, a plainly named clip
   file is `mmproj`.
2. One gap: a decoder header says nothing about a detached MTP head unless the
   tensor scan ran. With `role: 'main'` and no `tensorScan`, an `mtp-` name still
   counts (`roleSource: 'filename'`, reason recorded).
3. Parse failure, or a header with no architecture and no type (`role: null`):
   the name's role token (`mmproj`, `mtp`, `draft`, `embedding`, `reranker`),
   else `main`.

## Why

Every file is read once here, 4 at a time; the attacher's later read of the
first shard is a cache hit, so the scan costs no more disk than before. Companion
files (projectors, heads) used to be skipped by the parser entirely; their
headers are tiny.
