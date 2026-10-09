# RamPinSession

`core/shared/runtime/rampin/RamPinSession.js`

One RAM pin worker's lifetime: handles `pin` and `unpin` messages, streams
each file into the OS cache and locks it chunk by chunk behind the reader.

## Methods

- `new RamPinSession({ post, createLock, exit, lockChunkBytes, readBufferBytes, lockConcurrency, progressStepBytes })`.
  `post(message)` sends to the parent, `createLock()` returns a `MemoryLock`,
  `exit(code)` ends the process. The sizes default to the statics below and
  exist so tests can use tiny files.
- `handle(message)` returns a promise that settles when the message has been
  handled. `pin` runs the pin (only the first pin of a lifetime; later ones are
  ignored, the service restarts the worker to repin). `unpin` calls `exit(0)`.
  Anything else is ignored. Never rejects: failures post
  `{ type: 'error', message }` and call `exit(0)` after `ERROR_EXIT_DELAY_MS`.
- Statics: `LOCK_CHUNK_BYTES` (128 MiB), `READ_BUFFER_BYTES` (32 MiB),
  `LOCK_CONCURRENCY` (3), `PROGRESS_STEP_BYTES` (1 GiB),
  `ERROR_EXIT_DELAY_MS` (250), `GIB`.

Pin order: stat every file (empty list, missing file or non-file is an error),
`lock.prepare(totalBytes)`, then per file `lock.mapFile(file)` and lock each
chunk at `base + offset`. Progress is posted whenever another step's worth has
locked and at completion, then `{ type: 'pinned', totalBytes, seconds }`.

## Why

- **Cold-pin strategy** (ported from the RamPin C# tool): faulting cold mapped
  pages one 4 KB miss at a time is slow, so a sequential reader pulls each chunk
  into the OS cache at disk speed, and the lock that follows only takes cheap
  soft faults. Up to `LOCK_CONCURRENCY` locks run on the libuv threadpool.
- **128 MiB chunks** balance syscall count against progress resolution.
- **Errors exit the process**, because exiting releases partial locks, so an
  error can never strand unevictable pages. The short delay lets the error
  message flush first.
- Addresses are plain numbers: x64 user-mode pointers are below 2^47, inside
  Number's exact-integer range.
