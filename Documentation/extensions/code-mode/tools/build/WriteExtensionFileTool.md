# WriteExtensionFileTool

`extensions/code-mode/tools/build/WriteExtensionFileTool.js`

`write_extension_file { path, content }` (a [CodeTool](../CodeTool.md)).

## Behaviour

- `path` is required (`path is required`). Ensures the [BuildWorkspace](BuildWorkspace.md),
  emits an optimistic `writing` row, writes through `context.code.writeFile`
  (validated), then emits the `done` row (dropping the optimistic key when the
  path was normalised) and publishes a code card
  ([CodeArtifactPublisher](CodeArtifactPublisher.md)).
- Result: `{ success: true, path, valid, message }`; the message says the file
  is shown as a code card, or lists the validation problems and asks for another write.
