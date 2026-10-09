# ProcessMemory

`core/shared/runtime/ProcessMemory.js`

Reads a process's resident-set size in bytes, using `tasklist` on Windows and
`ps -o rss=` elsewhere.

## Methods

- `ProcessMemory.rssBytes(pid)` resolves the RSS in bytes, or `null` on a falsy
  pid or any failure. Never rejects.
- `ProcessMemory.rssBytesSync(pid)` is the same read, blocking. Returns `null`
  on a falsy pid or any failure. Never throws.
- `ProcessMemory.parseTasklistCsvKb(stdout, pid)` parses
  `tasklist /FI "PID eq <pid>" /NH /FO CSV` output into KiB, or `null`.
- `ProcessMemory.parsePsRssKb(stdout)` parses `ps -o rss= -p <pid>` output into
  KiB, or `null`.
- `ProcessMemory.TIMEOUT_MS` (8000) bounds each spawned command.

## Why two readers

The two callers differ in concurrency model: the placement ledger
(`core/placement/PlacementService`) samples inside a synchronous walk, the LLM
fit tester awaits. The parsing is shared and pure, which is what makes it
testable at all.

Callers treat `null` as "unknown". A zero or unparseable reading is reported as
`null`, never `0`, so an unknown sample can never look like an idle process.

Deliberately not folded into the CUDA pinning module: that one is about GPUs.

## Known limitation

The Windows parser takes the last CSV column as the working set. That holds for
`tasklist /NH /FO CSV` on an English install, but not for the `/V` verbose
format and not necessarily on a localised Windows where the column order or the
digit grouping differs. Kept as-is because changing it needs a real non-English
machine to verify against. A test pins the current behaviour.
