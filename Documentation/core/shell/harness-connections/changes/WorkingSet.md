# WorkingSet

`core/shell/harness-connections/changes/WorkingSet.js`

The config files one connect, disconnect or preview works on, edited in memory.

## Methods

- `new WorkingSet({ readText? })` (defaults to reading the disk; tests pass a map).
- `open(file, format)` the [ConfigDocument](../documents/ConfigDocument.md), parsed once.
- `original(file)` the text first seen (null = missing).
- `replace(file, text)` whole-file replacement (null deletes), overriding edits.
- `changes()` -> `[{ file, before, after }]` for files whose text would change.
- `commit(tx)` writes or removes each changed file through a [FileTransaction](../FileTransaction.md).

## Why

Nothing touches disk until the whole change is known, so preview and commit see
the same result and a parse error stops a connect before any write.
