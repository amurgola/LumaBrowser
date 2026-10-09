# OutputItems

`core/llm-server/server/responses/OutputItems.js`

Builds Responses output items, shared by the streaming and non-streaming paths. Pure.

## Methods

- `message(id, text, status)` an assistant message; `content` is `[]` while
  `in_progress`, else one `textPart(text)` (`output_text` with `annotations: []`).
- `reasoning(id, text)` `{ type: 'reasoning', id, summary: [], content: [reasoningPart(text)] }`.
- `toolCall({ id, callId, name, args, customTools, status })` a `function_call`
  (`arguments` string), or a `custom_tool_call` (`input`) when `name` is custom.
- `customInput(args)` the `input` string inside `{ "input": ... }`, else the raw arguments.

## Why

Codex parses `response.output_item.done` items into its own history and sends
them back next turn, so both paths must agree on these shapes.
