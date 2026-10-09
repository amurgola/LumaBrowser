# CodeTool

`extensions/code-mode/tools/CodeTool.js`

Base class for the Code mode's session-scoped agent tools (handed to the bridge
as `extraTools`, never registered globally).

## Methods

- `name`, `description` (getters): throw unless overridden.
- `inputSchema` (getter): default `{ type: 'object', properties: {} }`.
- `mutating` (getter): `true`/`false` is copied onto the tool for the approval
  gate; `undefined` (default) leaves the flag off so name-based gating applies.
- `handle(params, opts)`: throws unless overridden; resolves the
  `{ success, message, summary, error? }` result.
- `toTool()` -> `{ name, description, inputSchema, handler(params, opts = {}), mutating?, ...extras }`.
- `_extraFields()` (subclass hook): extra tool fields such as `projectRoot`
  (RunCommandTool) or `onResultEvicted` (ReadFileTool).

## Implementations

Build: WriteExtensionFileTool, ReadExtensionFileTool, ListExtensionFilesTool, InstallExtensionTool, DiscardBuildTool. Project: ProjectOverviewTool, ReadFileTool, GrepTool, FindTool, ListDirTool, EditFileTool, WriteFileTool, SaveArtifactTool, RunCommandTool, CheckProcessTool. Batch: BatchDispatchTool.
