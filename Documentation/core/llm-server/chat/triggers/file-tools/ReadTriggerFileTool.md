# ReadTriggerFileTool

`core/llm-server/chat/triggers/file-tools/ReadTriggerFileTool.js`

The `read_trigger_file` tool of a file-trigger run.

## Methods

- `new ReadTriggerFileTool(dir, defaultPath)`; `definition()` returns the tool
  entry whose handler calls `execute`.
- `execute({ path?, offset? })`: reads `path` (relative to the watch folder or
  absolute inside it), or the triggering file. Returns
  `{ success: true, path, name, size, chars, offset, truncated, content }` with
  up to `READ_MAX_CHARS` (256 K characters) from `offset`, or
  `{ success: false, error }`: `no path given and this run has no triggering file`,
  `path is outside the watch folder`, `file not found: <p>`, `not a file: <p>`,
  `binary file (<n> bytes); only text files can be read` (a NUL byte in the
  first `BINARY_SNIFF_BYTES`, 8 KB).
