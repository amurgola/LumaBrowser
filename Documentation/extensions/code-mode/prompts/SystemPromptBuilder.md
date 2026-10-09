# SystemPromptBuilder

`extensions/code-mode/prompts/SystemPromptBuilder.js`

Assembles the Code chat mode's system prompt.

## Methods (static)

- `build(data = {}, opts = {})`: `opts.mode === 'project'` delegates to
  [ProjectPrompt](ProjectPrompt.md). Otherwise the build prompt: identity,
  grounding, [EnvironmentBlocks](EnvironmentBlocks.md)`.apiReference`, the
  browser API, `.environment`, the validation note, the tool or no-tool
  workflow (`opts.hasTools`), and `<user_goal>` with the task, preferred name
  and target id (or "No build brief yet: ask the user ...").
