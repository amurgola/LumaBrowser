# EditArtifactHandler

`core/llm-server/chat/bridge/tools/handlers/EditArtifactHandler.js`

`edit_artifact`: saves the next VERSION of an artifact's chain. A
[ChatToolHandler](ChatToolHandler.md).

## Methods

- `execute(_, params, ctx)`: not found -> `edit_artifact: artifact "<id>" not
  found.`; image -> `IMAGE_REFUSAL`; live -> [LiveModuleEdit](../artifacts/LiveModuleEdit.md),
  fatal-JS gate, `createVersion`, publish with spec, "updated (vN)" message;
  otherwise `replacements` via [ArtifactTextEdit](../artifacts/ArtifactTextEdit.md)
  or a non-empty `content` rewrite (else `NO_EDIT`), `createVersion`, publish,
  and `Revised artifact "<title>" → vN (from <id>, <how>) ...` with the fuzzy
  and validation notes. Title: the param, trimmed, else the source's. A throw
  reads `edit_artifact failed: <message>`.
- `IMAGE_REFUSAL`, `NO_EDIT`.
