# LlmModelsScanner

`core/llm-server/LlmModelsScanner.js`

Scans the LLM models directory into one entry per logical model: GGUF weights
with their companions, MLX directories and add-on files, classified for runtimes
and annotated with the parsed GGUF header. Parts live in `core/llm-server/scanner/`.

## Methods

- `LlmModelsScanner.shared` the process-wide scanner (one parse worker, one header cache).
- `new LlmModelsScanner({ headerCache = defaultHeaderCache(), registry })`;
  `registry` is the [RuntimeCatalogRegistry](runtimes/RuntimeCatalogRegistry.md)
  for classification (default the shared one).
- `scan(rootDir)` resolves `{ available: true, dir, models, truncated, skipped }`,
  or `{ available: false, reason, models: [], dir }` for no directory ("No
  directory configured", `dir: null`), a missing one ("Directory does not
  exist: ...", `missing: true`), a file ("Not a directory: ...") or a stat
  error (its message). Models sort by `relativeDirectory`, then `name`.
  `truncated` is true when the walk hit 4000 entries. `skipped` is
  `{ diffusion: [paths], excludedDirs: [dirs] }`: image and video GGUFs whose
  header role is `diffusion` are dropped before grouping together with their
  later shards, and folders registered by another service in
  [ModelFolderRegistry](../shared/ModelFolderRegistry.md) (the image models
  folder, which sits under the LLM one by default) are never walked
  (`FOLDER_KIND` is `'llm'`).
- `LlmModelsScanner.spawnParseWorker()` is
  `new Worker(path.join(__dirname, 'ggufParseWorker.js'))`.
- `LlmModelsScanner.defaultHeaderCache()` a [GgufHeaderCache](scanner/GgufHeaderCache.md)
  over a [GgufParseWorkerClient](scanner/GgufParseWorkerClient.md), persisted to
  `<userData>/gguf-header-cache.json` (no persistence without Electron).
- `PARSE_CONCURRENCY` 4, `HEADER_CACHE_FILE`.

## Model entry

`{ kind: 'weights'|'mmproj-only'|'mtp-only'|'mlx'|<addon kind>, name, directory,
relativeDirectory, role?, roleSource?, roleReason?, weights[{ path, name,
sizeBytes, modifiedAt, shardIndex, shardTotal }], weightsCount,
weightsExpectedShards, weightsTotalBytes, mmproj, mmprojTotalBytes, drafter?,
drafterTotalBytes?, mtp?, mtpTotalBytes?, totalBytes, sidecars,
unpairedCompanions?, pairing?, gguf?, mlx?, addon?, preferredRuntimes, compatibleRuntimes, mtpCapable, mtpGrafted? }`.

GGUF entries carry `role` (`main`, `draft`, `embedding`, `reranker`, `mmproj`,
`mtp`) with `roleSource` `'header'` or `'filename'`; weights entries list the
companions they could not claim unambiguously in `unpairedCompanions`, and a
companion listed on its own carries its `pairing` verdict (see
[GgufModelGrouper](scanner/GgufModelGrouper.md)).

## Flow

1. [ModelDirWalker](scanner/ModelDirWalker.md) collects candidates.
2. [GgufRoleResolver](scanner/GgufRoleResolver.md) reads every single file and
   first shard through the header cache, 4 at a time, and decides its role from
   the header; the file name is the fallback.
3. [GgufModelGrouper](scanner/GgufModelGrouper.md) (with those roles),
   [MlxModelBuilder](scanner/MlxModelBuilder.md) and
   [AddonModelBuilder](scanner/AddonModelBuilder.md) build entries.
4. [ModelClassifier](scanner/ModelClassifier.md) tags each from file names.
5. [GgufHeaderAttacher](scanner/GgufHeaderAttacher.md) copies the headers (cache
   hits) onto `model.gguf`, merging split shards
   ([ShardScanMerger](scanner/ShardScanMerger.md)); new parses are flushed to disk.
6. [ModelSidecars](scanner/ModelSidecars.md) attaches metadata files.

## Why

The worker entry is loaded by path from this directory. The scan output was verified byte-identical (JSON) to the
legacy scanner on a synthetic tree and on the real LumaBrowser models folder.
