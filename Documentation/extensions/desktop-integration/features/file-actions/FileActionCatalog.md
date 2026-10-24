# FileActionCatalog

`extensions/desktop-integration/features/file-actions/FileActionCatalog.js`

The [file-actions](index.md) catalog: which actions apply to a selection.

- `available(items, env, { maxFiles })` -> `[{ id, label, group, multi }]` for
  [FileSelection](FileSelection.md) items, filtered by kind, count and size
  (images 8 MB, text 200 KB, PDF 20 MB, the chat's own limits) and by `env`
  ([FileActionEnv](FileActionEnv.md): `canChat`, `canSpeak`, `canEditImages`,
  `agents`). Order: image or document actions, then `ask-files`, then one
  `kb-add:<agentId>` per agent (at most `MAX_AGENTS`, 10).
- `resolve(id, items, env, options)` -> the action when it applies, else null;
  `ASK` (`'ask'`) maps to the fitting `ask-image`, `ask-file` or `ask-files`.
- `agentIdOf(actionId)`: the agent id of a `kb-add:` action, else null.
- `isKnowledgeDocument(item)`: a file the knowledge base can ingest
  (DocumentParser: Markdown, text, HTML, PDF).
