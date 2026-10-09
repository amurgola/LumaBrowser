# EvalAdapter

`core/llm-server/eval/EvalAdapter.js`

Wires [EvalRunner](EvalRunner.md)'s injected `agentRun` to the live agent. Needs
the running app (a browser service and a ready model); unit tests use fakes.

## Methods

- `EvalAdapter.makeAgentRun({ llmService, deps, Runner? })` builds an
  [AgentRunner](../agent/AgentRunner.md) (`Runner` is a test seam) with
  `{ browserService }` from `deps` and `deps.db`, and returns `agentRun({ task, variant })`, which:
  - throws `task "<id>" needs the bridge adapter (pseudo-tool); skipping in AgentRunner-only mode`
    for unsupported tasks (EvalRunner records the throw as an errored transcript);
  - runs `{ prompt, tools: task.allowedTools (array only), systemPromptAppend,
    systemPromptOverride, maxIterations: task.maxIterations || 12,
    timeout: task.timeout || 240000, autoCloseTab: true, lazyTab: true }`;
  - resolves `{ finalResponse, iterations, durationMs, toolCalls, error }`.
- `EvalAdapter.makeBridgeAgentRun({ bridge, deps })` returns
  `agentRun({ task, variant, modelRef })` that calls
  `bridge.runForEval({ task, variant, deps, modelRef })`; covers every category.
  Throws `makeBridgeAgentRun: a bridge with runForEval() is required`.
- `EvalAdapter.supportsTask(task)` false when an expected tool call is in
  `BRIDGE_ONLY_TOOLS` (`create_artifact`, `edit_artifact`, `generate_image`,
  `edit_image`, `validate_code`).
- `EvalAdapter.promptAppend(task, variant)` `variant.buildAppend(task)`, else
  `variant.systemPromptAppend`, else `''`.
- `EvalAdapter.promptOverride(variant)` the `variant.buildPrompt` function
  (AgentRunner calls it with its live render context), else `variant.systemPrompt`
  when not null, else undefined.

## Why two paths

The pseudo-tools are injected by the chat bridge, not AgentRunner, so the
AgentRunner-only path covers browser-tool tasks (cheap append-only A/Bs). The
bridge path runs every category with the full live deps a chat turn gets;
variants there A/B the base prompt.
