# StreamedToolCallItem

`core/llm-server/server/responses/StreamedToolCallItem.js`

A tool call while it streams (`fc_` id). Extends [StreamedOutputItem](StreamedOutputItem.md).

## Methods

- `new StreamedToolCallItem({ outputIndex, emit, call, customTools })` takes
  `call_id` (upstream id or minted) and name from the first upstream delta.
- `append(args)` accumulates arguments; a function tool emits
  `response.function_call_arguments.delta`.
- On close a function tool emits `response.function_call_arguments.done`
  (`name`, `arguments`); a custom tool emits `response.custom_tool_call_input.done`
  (`input`). The done item comes from [OutputItems](OutputItems.md)`.toolCall`.

## Why

A custom tool's raw input is only known once its `{ input }` JSON is whole, so
it streams no deltas.
