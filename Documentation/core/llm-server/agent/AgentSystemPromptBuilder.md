# AgentSystemPromptBuilder

`core/llm-server/agent/AgentSystemPromptBuilder.js`

Builds the agent's complete system prompt for one run: computes the live
render context and hands it to [SystemPromptRenderer](SystemPromptRenderer.md)
or to a caller's override.

## Methods

- `new AgentSystemPromptBuilder(db)`: reads `aiChat.systemPrompt` (the user's
  custom prompt) from `db`; a missing db means none.
- `build({ tabInfo, defaultTabId, allowedTools, systemPromptAppend,
  systemPromptOverride, noBrowser, parallelToolCalls, promptExperiments })`
  returns the prompt.

The render context is `{ tabInfo, defaultTabId, allowedTools, tools,
userCustom, systemPromptAppend, append, noBrowser, parallelToolCalls,
omitExecRules }`. `tools` are the
[AgentPromptText](AgentPromptText.md) lines filtered to `allowedTools` (none
in noBrowser mode); `append` is userCustom and systemPromptAppend joined by a
newline.

## Overrides and experiments

- A function override receives the context and owns the whole prompt,
  including the append.
- A string override is used verbatim with `\n\nADDITIONAL INSTRUCTIONS:\n<append>`
  re-attached when there is an append.
- Eval-only `promptExperiments`: `no-exec-rules` drops `<execution_rules>` and
  the forward reference to it. Unknown names change nothing.
