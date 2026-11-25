# Int8ConvrotWorkers

`core/image-server/models/int8/Int8ConvrotWorkers.js`

A small pool of worker threads for the INT8 convrot conversion.

## Methods

- `new Int8ConvrotWorkers({ spawn?, size? })`. `spawn` returns a `worker_threads` Worker (a test seam); `size`
  defaults to `defaultSize()`.
- `run(task)` resolves `{ codes: Int8Array, scales: Float32Array }` for one layer task
  ([Int8ConvrotWorker](Int8ConvrotWorker.md)); rejects with the worker's message when the layer fails, or with
  the worker's error when the thread dies.
- `close()` terminates the workers and rejects every running and waiting layer with `The conversion was stopped.`
- `Int8ConvrotWorkers.defaultSize()`: half the cores, between 1 and 8.

## Why

Workers are started only as layers arrive, each converts one layer at a time, and waiting layers go to whichever
worker frees up, which bounds memory to `size` layers. Half the cores keeps the app responsive; Anima's 280
layers convert in about 3 seconds on 8 workers.
