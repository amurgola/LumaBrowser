# SaveArtifactTool

`extensions/code-mode/tools/project/SaveArtifactTool.js`

`save_artifact { artifactId, path, overwrite? }` (a [CodeTool](../CodeTool.md),
`mutating: true`): the only route from a chat artifact to a project file.

## Behaviour

- `new SaveArtifactTool({ workspace, getArtifactStore })`.
- Requires a path and a store (`Artifacts are not available in this session.`).
- `"latest"` or no id picks this conversation's newest artifact; a miss lists
  the conversation's artifacts ([ArtifactFile](ArtifactFile.md)`.describeAll`).
- A path without an extension gets the artifact's natural one.
- Writes through `context.code.writeBytes` (contained; a traversal throws and
  becomes `Save failed: ...`; an existing file needs `overwrite: true`).
- Result: `{ success, path, bytes, artifactId, type, message: 'Saved <kind> "<title>" to <path> (<n> bytes[, replaced]).', summary }`.
