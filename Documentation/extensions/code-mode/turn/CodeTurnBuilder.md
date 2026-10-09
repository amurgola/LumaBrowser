# CodeTurnBuilder

`extensions/code-mode/turn/CodeTurnBuilder.js`

The Code mode's per-turn config (`buildTurn`).

## Methods

- `new CodeTurnBuilder({ context, sessions })`.
- `build({ meta, conversationId, modelRef = null })` ->
  `{ systemPrompt, temperature: 0.2, agent, tools, allowedTools, kbScope?, modelRef?, noBrowser: true, agentBudget }`.
  - With `context.code` and `data.projectPath`: [ProjectTools](../tools/project/ProjectTools.md)
    sized by [ReadBudget](../tools/project/ReadBudget.md), plus
    [BatchDispatchTool](../tools/batch/BatchDispatchTool.md) (a fresh BatchScheduler and a
    [SubAgentRunner](../tools/batch/SubAgentRunner.md) on `modelRef`) when
    [DecodeSlots](DecodeSlots.md) reports more than one slot. Whole-read claims
    are cleared at the start of each turn.
  - Else with `context.code` and a task: [ExtensionBuildTools](../tools/build/ExtensionBuildTools.md).
  - Else plain chat: `tools`, `allowedTools` and `agentBudget` are null, `agent` false.
  - `allowedTools` pins the turn to its tools plus `validate_code`; in project
    mode an [AgentOverlay](AgentOverlay.md) adds the agent's grants and its
    `kbScope`/`modelRef`.
  - The prompt is [SystemPromptBuilder](../prompts/SystemPromptBuilder.md) with
    `hasCommand`, the capabilities snapshot, the batch concurrency, the persona
    and (project mode) [ContextFilesBlock](ContextFilesBlock.md).
- `AGENT_BUDGET`: `{ maxIterations: 40, noTimeout: true, reasoningCharsPerStep: 1e9, reasoningCharsTotal: 1e9 }`.

## Why

A build is bounded by work, not wall clock (a 30-minute cap killed productive
runs mid-edit); the reasoning allowances mean "all the window can spare" and
AgentRunner clamps them. Without the tool pin, local models fall back to a
familiar create_artifact instead of the mode's tools.
