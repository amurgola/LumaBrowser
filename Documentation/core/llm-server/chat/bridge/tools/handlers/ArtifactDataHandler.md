# ArtifactDataHandler

`core/llm-server/chat/bridge/tools/handlers/ArtifactDataHandler.js`

`get_artifact_data` and `update_artifact_data`: the agent-side twin of a live
widget's injected `store`. A [ChatToolHandler](ChatToolHandler.md).

## Methods

- `names()`: both tools.
- `execute(name, params, ctx)`: needs `ctx.deps.artifactDataStore` and an
  [ArtifactId](../artifacts/ArtifactId.md). `get` returns `store.all(id)`;
  `update` calls `store.mutate(id, { set, remove })`, passes a failure through
  verbatim and otherwise returns `{ success: true, rev, keys, message: SAVED }`
  (the data is never echoed).
