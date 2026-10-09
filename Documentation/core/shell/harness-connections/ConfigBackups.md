# ConfigBackups

`core/shell/harness-connections/ConfigBackups.js`

Keeps the pre-LumaBrowser copy of each agent config file and decides when
disconnect may put it back byte for byte.

## Methods

- `new ConfigBackups(dir)`: backups go to `<dir>/<harness>/<flattened path>.orig`.
- `record(harness, changes, previous = {})` -> `{ [file]: { existed, backup, exact, writtenHash } }`
  for a connect's `[{ file, before, after }]`. A file changed for the first time
  is backed up (if it existed); a reconnect keeps the first backup and stays
  `exact` only if the file still held our last write.
- `original(record, currentText)` -> the backup text, `null` (delete: we created
  the file), or `undefined` (the file changed since our write, or the backup is
  gone; only key-by-key undo is safe).
- `ConfigBackups.fingerprint(text)` sha256 hex, null for a missing file.

## Why

Key-by-key undo restores values but cannot recreate formatting we never saw
(for example a TOML table we replaced). When nobody touched the file since our
write, the backup is the exact original. Backups are kept after disconnect as a
safety net and overwritten by the next first connect.
