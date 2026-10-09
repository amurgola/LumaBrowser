# FileGrep

`core/shell/code-search/FileGrep.js`

Searches one file line by line for the Node search backend.

## Methods

- `await FileGrep.search(abs, rel, regex, limit, matches)` appends `{ file: rel, line, text }` (1-based lines) to the
  shared `matches` array and returns true once `matches.length` reaches `limit`. Files over
  `FileGrep.MAX_FILE_BYTES` (2 MiB, the same ceiling ripgrep is given), files containing a NUL byte (binary) and
  unreadable files are skipped.
- `await FileGrep.sizeOf(abs)` is the file size, or 0 when it cannot be read.
