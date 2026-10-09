# WriteFileTool

`extensions/code-mode/tools/project/WriteFileTool.js`

`write_file { path, content }` (a [CodeTool](../CodeTool.md); name-gated by the
approval gate).

## Behaviour

`context.code.writeFile`; a guard refusal (`res.error`, e.g. FS_NOT_OBSERVED when
overwriting a file nobody read) is `{ success: false, error, message: 'Write failed: ...' }`.
On success the file is tracked, `project:state` emitted, and the message reports
bytes and validation. Summary `<path> · N bytes[ · issues]`.
