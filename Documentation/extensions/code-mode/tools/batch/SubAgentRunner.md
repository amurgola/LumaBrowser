# SubAgentRunner

`extensions/code-mode/tools/batch/SubAgentRunner.js`

Runs one batch sub-task as a focused agent run on the parent's project workspace.

## Methods

- `new SubAgentRunner({ context, meta, modelRef = null, getRouter = ExtensionGlobals.chatRouter, Bridge = null })`
  (`Bridge` defaults to core AgentChatBridge, required lazily).
- `run(task, { emit?, isAborted? })` -> `{ text, error, changedFiles }`. Errors,
  never throws: `chat router unavailable` (no router or no `getAgentDeps`),
  `no model configured`, `stopped before starting`, a failed start. One
  `bridge.run` with: the turn's `modelRef` (else the router default),
  `deps: router.getAgentDeps()`, a fresh `codebatch:<stamp>` conversation,
  `EXPLORE_PROMPT` or `EDIT_PROMPT`, the project tools as `extraTools` and the
  allow-list (plus validate_code), `noBrowser`, `agentBudget: { maxIterations: 24,
  noTimeout: true }` and `shouldAbort: isAborted`.
- `asFunction()` -> `runSubAgent` for [BatchDispatchTool](BatchDispatchTool.md).
- Tools: explore gets `EXPLORE_TOOLS` (overview, read, grep, find, list);
  edit gets everything except `run_command` and `check_process` (no one can
  answer an approval card on a private bridge).
