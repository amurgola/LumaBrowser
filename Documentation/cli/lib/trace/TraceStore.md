# TraceStore

`cli/lib/trace/TraceStore.js`

Finds and reads the trace files.

## Methods (static)

- `TraceStore.resolveDir(env?)`: `$LUMA_TRACE_DIR`, else the `dir` in the pointer file the app
  writes on first use (`~/.lumabrowser/traces.json`), else `null`.
- `TraceStore.pointerFile()`.
- `TraceStore.listFiles(dir)`: `[{ id, file, mtime, size }]` for `*.jsonl`, newest first; rotated
  `*.1.jsonl` files are skipped; `[]` for a missing folder.
- `TraceStore.find(dir, files, id)`: `last` is the newest conversation other than the shared
  `_side` file (which is used only when it is all there is); an id not listed is still found if its
  file exists; else `null`.
- `TraceStore.readRecords(file)`: one parsed record per line; blank and torn lines (the app
  mid-write) are skipped.
