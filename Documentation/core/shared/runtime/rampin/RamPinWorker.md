# RamPinWorker

`core/shared/runtime/rampin/RamPinWorker.js`

Entry script of the RAM pin utilityProcess. Loading the file starts the worker:
it connects to its parent through `RamPinMessagePort`, and hands every message
to a `RamPinSession` whose lock is the platform's `MemoryLock`. Never `require`
it; fork it.

## Methods

- `RamPinWorker.main()` runs at load. With no parent port (run directly) the
  process exits with code 1.
- `RamPinWorker._createLock(platform)` picks `WindowsMemoryLock` on `win32`,
  otherwise `LinuxMemoryLock` (macOS therefore fails at library load and
  reports an error message, as in legacy).

## Protocol

Over `process.parentPort` under Electron `utilityProcess`, or `process.send`
under a plain `child_process.fork` (tests):

- in: `{ type: 'pin', files: [{ path, sizeBytes }] }` (sizes are re-read from
  disk; the given `sizeBytes` is ignored)
- out: `{ type: 'progress', lockedBytes, totalBytes }` about every 1 GiB and at
  completion
- out: `{ type: 'pinned', totalBytes, seconds }`
- out: `{ type: 'error', message }`, then the process exits after 250 ms
- in: `{ type: 'unpin' }` exits the process immediately

## Why it works

The OS backs all mappings of one file with a single set of physical pages
(Windows: one section object; Linux: the page cache). When llama-server later
opens the same paths it reads the pages this worker has wired, with zero copy.
The locks are per-process and die with this process, so "unpin" is simply
exiting, and a crash or app quit can never leak unevictable memory.

## Build constraint

The file name must keep ending in `worker.js` (case-insensitive). The bytecode
build ships `*worker.js` as plain JS because utilityProcess isolates reject
main-process bytecode; release 1.7.8 shipped this worker compiled and RAM
pinning silently did nothing. Its requires (`RamPinMessagePort`,
`RamPinSession`, the lock classes) must therefore also load as plain JS inside
the worker, which matters if the build's bytecode rules are ported.
