# CodeModeDescriptor

`extensions/code-mode/CodeModeDescriptor.js`

The `code` chat mode descriptor handed to `context.chat.registerMode`.

## Methods (static)

- `create(context, sessions)` -> `{ id: 'code', label: 'Code', icon, description,
  requirements: ['llm'], chatUiUrl: context.chat.uiUrl('chat-ui.js'), setupSchema,
  workspaceRoot(args), buildTurn(args), postProcess(args) }`. `buildTurn` is
  [CodeTurnBuilder](turn/CodeTurnBuilder.md)`#build`; `postProcess` is
  [BuildStatePersister](turn/BuildStatePersister.md)`#run`.
- `SETUP_SCHEMA`: a `kind` select (`project` | `build`), `projectPath`
  (directory browse, required, shown for project), `task` (required textarea),
  `name` (optional, shown for build).
- `workspaceRoot(sessions, { conversationId, meta })` -> the Code tab's folder:
  `meta.data.projectPath` (label = basename), else the live build's staging dir
  (label = build id), else `meta.data.build.dir` after a restart; null hides the tab.
- `MODE_ID` is `'code'`.
