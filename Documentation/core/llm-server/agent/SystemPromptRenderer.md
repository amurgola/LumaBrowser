# SystemPromptRenderer

`core/llm-server/agent/SystemPromptRenderer.js`

Renders the agent's base system prompt (the 2026 XML structure) from a live
render context. Every Tools-on chat turn uses it.

## Methods

- `SystemPromptRenderer.render(ctx, now = new Date())`, where `ctx` is
  `{ tabInfo, tools, append, noBrowser, parallelToolCalls, omitExecRules }`.
  Pure apart from the date.

## Blocks, in order

`<system_role>`, `<current_date>`, `<key_constraints>`, `<dynamic_state>`
(browser only), `<formatting_constraints>` (the ```` ```tool ```` wire protocol),
`<tool_definitions>` (when tools exist), `<additional_instructions>` (when an
append exists), `<execution_rules>` (unless `omitExecRules`). Bodies are
indented two spaces; blocks are separated by a blank line.

## Why

Small quantized models follow delimited structure better than prose and lose
rules buried in the middle of a long prompt, so the hard constraints are stated
at the head and restated at the tail with the tool schemas between. noBrowser
keeps the protocol and stepwise rules and drops the browser framing, the tab
state and the tool list. Batching is described only when the run's pool allows it.
