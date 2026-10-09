# FolderScanner

`core/llm-server/chat/triggers/file/FolderScanner.js`

Takes a bounded snapshot of a watch folder.

## Methods

- `FolderScanner.scan(dir, { recursive = false, matches })` (async) returns
  `{ files: Map(relPath -> [mtimeMs, size]), overflow }`. Only files passing
  `matches(relPath)` are recorded (all files without a matcher). Recursion
  goes at most `MAX_DEPTH` (6) levels and never follows directory symlinks.
  The walk stops after `MAX_ENTRIES` (20000) directory entries with
  `overflow: true`. Unreadable directories and files that vanish mid-scan are
  skipped.
