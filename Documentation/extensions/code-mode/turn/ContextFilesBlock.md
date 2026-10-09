# ContextFilesBlock

`extensions/code-mode/turn/ContextFilesBlock.js`

The project's AGENTS.md / CLAUDE.md block for the project prompt.

## Methods (static)

- `render(context, sessions, conversationId, data)` -> the
  [ProjectContextFiles](../../../core/shell/ProjectContextFiles.md) block, or
  null. `data.noContextFiles` opts out. With an open workspace it reads
  `context.code.contextFiles(workspaceId)`; on the first turn (the workspace
  opens lazily on the first tool call) it collects straight from
  `data.projectPath` through a container-routed fs. Any failure is null:
  instructions are a bonus, never a blocker.
