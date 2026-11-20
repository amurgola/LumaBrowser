# SystemPromptRenderer

`core/llm-server/agent/SystemPromptRenderer.js`

Renders the agent's base system prompt (the 2026 XML structure) from a live
render context. Every Tools-on chat turn uses it.

## Methods

- `SystemPromptRenderer.render(ctx, now = new Date())`, where `ctx` is
  `{ tabInfo, tools, append, noBrowser, parallelToolCalls, omitExecRules, nativeTools, role, userCustom,
  systemPromptAppend }`.
  Pure apart from the date. `role` (trimmed, when not blank) is the text of `<system_role>` in place of
  the stock `ROLE_BROWSER` / `ROLE_NO_BROWSER`; the chat passes its assistant role
  ([ChatAssistantText](../chat/ChatAssistantText.md)`.ROLE_TOOLS`).

## Blocks, in order

`<system_role>`, `<current_date>`, `<key_constraints>`, `<dynamic_state>`
(browser only), `<formatting_constraints>` (the ```` ```tool ```` wire protocol),
`<tool_definitions>` (when tools exist), `<additional_instructions>` (when an
append exists), `<user_instructions>` (when the user has a custom prompt),
`<execution_rules>` (unless `omitExecRules`). Bodies are
indented two spaces; blocks are separated by a blank line.

A context that names `userCustom` or `systemPromptAppend` (what
[AgentSystemPromptBuilder](AgentSystemPromptBuilder.md) passes) gets the caller's append in
`<additional_instructions>` and the user's custom prompt in `<user_instructions>` after it, under
`SystemPromptText.USER_INSTRUCTIONS_LEAD` (their instructions win over the guidance above). Until
2026-11-18 the custom prompt was the first lines of `<additional_instructions>`, ahead of the tool
manuals and indistinguishable from them. A context that gives only `append` keeps everything in
`<additional_instructions>`.

With `nativeTools` (the run's model takes tools as a registered `tools` array)
`<formatting_constraints>` and `<tool_definitions>` are left out. The registered
schemas are that model's tool contract (the browser tools are in the array with
fuller descriptions than the prose lines), and a prompt that also describes the
```` ```tool ```` fence asks the model to choose between two protocols, one of
which the server does not parse. On Qwen3.8-27B with native tools forced on
(2026-11-18, `npm run bench:prompt -- --native`) this took the fresh Tools-on
request from 9,051 to 8,430 tokens with no case regressing (14 of 16 before and after).

## Why

Small quantized models follow delimited structure better than prose and lose
rules buried in the middle of a long prompt, so the two hard constraints open the
prompt and the working rules (`<execution_rules>`: decide from what happened, recover
from a failed tool, show images, page refs, URL changes) close it, with the tool
schemas between. Each rule is written once (see
[SystemPromptText](SystemPromptText.md), "Each rule once"). noBrowser
keeps the protocol and stepwise rules and drops the browser framing, the tab
state and the tool list. Batching is described only when the run's pool allows it.
