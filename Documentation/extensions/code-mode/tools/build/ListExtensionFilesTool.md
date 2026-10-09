# ListExtensionFilesTool

`extensions/code-mode/tools/build/ListExtensionFilesTool.js`

`list_extension_files {}` (a [CodeTool](../CodeTool.md)).

## Behaviour

`{ success: true, files }` from `context.code.listFiles` (`[{ path, bytes }]`),
or `files: []` before any write.
