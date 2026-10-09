# LogTail

`core/shell/detached-processes/LogTail.js`

Reads the last bytes of a detached command's log for
[DetachedProcesses](../DetachedProcesses.md).

## Methods

- `LogTail.read(logPath, bytes = 4096)` returns `{ text, totalBytes, logPath }`.
  No path gives `{ text: '', totalBytes: 0, logPath: null }`; an unreadable log
  gives empty text with the path. Never throws.
- `LogTail.clampBytes(bytes)` limits the count to 1..`MAX_BYTES` (256 KiB);
  non-numbers become `DEFAULT_BYTES` (4 KiB).

When the read starts mid-file, the torn first line is dropped, unless the only
newline is the last character (one long line is kept rather than lost).
