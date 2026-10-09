# ProjectTools

`extensions/code-mode/tools/project/ProjectTools.js`

The project tool set for one turn, over the folder the setup named. Every file
operation goes through `context.code` (CodeWorkspace), which owns path
containment and the read-before-mutate guard.

## Methods (static)

- `create({ context, conversationId, meta, sessions, truncator, wholeFileMaxBytes = 0, ctxPerSlot = 0, artifacts = null })`
  -> the plain tools of [ProjectOverviewTool](ProjectOverviewTool.md),
  [ReadFileTool](ReadFileTool.md), [GrepTool](GrepTool.md), [FindTool](FindTool.md),
  [ListDirTool](ListDirTool.md), [EditFileTool](EditFileTool.md),
  [WriteFileTool](WriteFileTool.md), [SaveArtifactTool](SaveArtifactTool.md),
  [RunCommandTool](RunCommandTool.md) (with `context.db` for the classifier
  setting) and [CheckProcessTool](CheckProcessTool.md), sharing one
  [ProjectWorkspace](ProjectWorkspace.md) and one [WholeReadGuard](WholeReadGuard.md)
  (budget from `ctxPerSlot` and the truncator's chunk cap). Each handler is
  wrapped to tally the served message length (all arguments pass through, so
  `opts.emit` survives). `artifacts` injects an ArtifactStore (tests).
- `routerArtifactStore()` -> `ExtensionGlobals.chatRouter().getAgentDeps().artifactStore`, or null.
