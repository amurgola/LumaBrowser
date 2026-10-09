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
- `scan(rootDir)` resolves `{ available: true, dir, models, truncated }`, or
  `{ available: false, reason, models: [], dir }` for no directory ("No directory
  configured", `dir: null`), a missing one ("Directory does not exist: ...",
  `missing: true`), a file ("Not a directory: ...") or a stat error (its message).
  Models sort by `relativeDirectory`, then `name`. `truncated` is true when the
  walk hit 4000 entries.
- `LlmModelsScanner.spawnParseWorker()` is
  `new Worker(path.join(__dirname, 'ggufParseWorker.js'))`.
- `LlmModelsScanner.defaultHeaderCache()` a [GgufHeaderCache](scanner/GgufHeaderCache.md)
  over a [GgufParseWorkerClient](scanner/GgufParseWorkerClient.md), persisted to
  `<userData>/gguf-header-cache.json` (no persistence without Electron).
- `PARSE_CONCURRENCY` 4, `HEADER_CACHE_FILE`.

## Model entry

`{ kind: 'weights'|'mmproj-only'|'mtp-only'|'mlx'|<addon kind>, name, directory,
relativeDirectory, weights[{ path, name, sizeBytes, shardIndex, shardTotal }],
weightsCount, weightsExpectedShards, weightsTotalBytes, mmproj, mmprojTotalBytes,
drafter?, drafterTotalBytes?, mtp?, mtpTotalBytes?, totalBytes, sidecars, gguf?,
mlx?, addon?, formatRequirements, preferredRuntimes, compatibleRuntimes,
mtpCapable, mtpGrafted? }`.

## Flow

1. [ModelDirWalker](scanner/ModelDirWalker.md) collects candidates.
2. [GgufModelGrouper](scanner/GgufModelGrouper.md), [MlxModelBuilder](scanner/MlxModelBuilder.md)
   and [AddonModelBuilder](scanner/AddonModelBuilder.md) build entries.
3. [ModelClassifier](scanner/ModelClassifier.md) tags each from file names.
4. [GgufHeaderAttacher](scanner/GgufHeaderAttacher.md) reads headers, 4 at a time
   ([BoundedParallel](scanner/BoundedParallel.md)), merging split shards
   ([ShardScanMerger](scanner/ShardScanMerger.md)); new parses are flushed to disk.
5. [ModelSidecars](scanner/ModelSidecars.md) attaches metadata files.

## Why

The worker entry is loaded by path from this directory and must keep its name:
the bytecode build skips `*worker.js` files because worker isolates reject
main-process bytecode. The scan output was verified byte-identical (JSON) to the
legacy scanner on a synthetic tree and on the real LumaBrowser models folder.
