# ToolCallAccumulator

`core/llm-service/providers/openai/ToolCallAccumulator.js`

Reassembles native tool calls streamed as argument fragments.

## Methods

- `add(delta)`: merges one `tool_calls` delta into the slot for its `index`
  (default 0). The first id and name win; argument text is appended. Returns
  `{ index, id, name, argsDelta }` for `onToolCallDelta`.
- `finalize()`: calls in index order as `{ id, type: 'function', function:
  { name, arguments }, parsedArguments }`. A missing id becomes
  `call_<ms>_<index>`, empty arguments `'{}'`, and unparseable arguments
  parse to `{ _raw: text }`.
