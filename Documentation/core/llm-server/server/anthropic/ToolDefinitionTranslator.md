# ToolDefinitionTranslator

`core/llm-server/server/anthropic/ToolDefinitionTranslator.js`

Translates Anthropic tool definitions and `tool_choice` into OpenAI function tools.

## Methods

- `ToolDefinitionTranslator.apply(body, out)` writes `out.tools` when at least
  one tool translates, and only then `out.tool_choice`
  (`auto` -> `'auto'`, `any` -> `'required'`, `none` -> `'none'`,
  `tool` + name -> `{ type: 'function', function: { name } }`, anything else
  nothing) and `parallel_tool_calls: false` for `disable_parallel_tool_use: true`.
- `ToolDefinitionTranslator.functions(tools)` returns the function tools for
  custom tools (`type` absent or `'custom'`, string `name`); description
  defaults to `''`, schema to `{ type: 'object', properties: {} }`.

## Why

Server-side tool types (web_search, computer, bash...) have no local
implementation, so they are dropped rather than offered to a model that could
never run them.
