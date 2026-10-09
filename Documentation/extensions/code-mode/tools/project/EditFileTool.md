# EditFileTool

`extensions/code-mode/tools/project/EditFileTool.js`

`edit_file { path, edits: [{ oldText, newText }] }` (a [CodeTool](../CodeTool.md);
name-gated by the approval gate).

## Behaviour

`context.code.editFile`; a refusal (unread or stale file, missing file, ambiguous
oldText) comes back as `{ success: false, error, message: 'Edit failed: ...' }`,
never a throw. On success the file is tracked, `project:state` emitted, and the
message reports the change count and validation (clean, or the problems and
"Fix them with another edit_file."). Summary `<path> · N edit(s)[ · issues]`.
