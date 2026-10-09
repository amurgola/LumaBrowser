# FilterBuildWorker

`core/adblocker/FilterBuildWorker.js` (class) and `core/adblocker/filterWorker.js` (worker entry)

Builds the Ghostery ads-and-tracking filter engine inside a worker thread and
posts the serialized bytes to the parent.

## Methods

- `FilterBuildWorker.run(parentPort, workerData)` builds from
  `workerData.cachePath` and posts the bytes (transferring the buffer).
- `FilterBuildWorker.build(cachePath)` returns the serialized engine. Uses
  `FiltersEngine.fromPrebuiltAdsAndTracking` with `cross-fetch`, reading and
  writing the cache file so only the first launch downloads the lists.
- `filterWorker.js` is the entry the launcher loads by path. It just calls
  `run` and rethrows a failure so it reaches the parent as the worker's `error` event.

## Why it stays plain JS

Worker isolates reject bytecode compiled in the main process. The bytecode
build skips any file whose name ends in `worker.js` (case-insensitive), so both
files must keep names ending that way.

`@ghostery/adblocker` is resolved through `@ghostery/adblocker-electron` so the
engine is serialized by the same version the adapter later deserializes.
