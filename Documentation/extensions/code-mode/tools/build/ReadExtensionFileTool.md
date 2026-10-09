# ReadExtensionFileTool

`extensions/code-mode/tools/build/ReadExtensionFileTool.js`

`read_extension_file { path }` (a [CodeTool](../CodeTool.md)).

## Behaviour

- Before any write: `{ success: false, error: 'No files written yet.' }`.
- Otherwise `{ success: true, content }` from `context.code.readFile`, or
  `{ success: false, error }` when it throws (containment, missing file).
