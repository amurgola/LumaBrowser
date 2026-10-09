# ToolFenceParser

`core/llm-service/tools/ToolFenceParser.js`

The strict ```` ```tool ```` fence parser for the chat agent's text tool calls.

## Methods

- `ToolFenceParser.parseAll(content)` returns every complete call, in model
  order, normalized by [ToolCallNormalizer](ToolCallNormalizer.md). Fences
  that are truncated, unparseable or nameless are skipped.
- `ToolFenceParser.parseFirst(content)` the first call or `null`.
- `ToolFenceParser.fixIllegalJsonEscapes(text)` doubles backslashes that are
  not legal JSON escapes.

## Why

- A call ends where its braces balance ([BalancedJson](../../shared/llm/BalancedJson.md)),
  not at the next ```` ``` ````. A lazy regex once cut a markdown document at
  its own nested code fence and wrote a fragment over the file as a success.
- Parsing resumes after the consumed body, so a payload containing the text
  ```` ```tool ```` cannot open a phantom second call.
- The whole batch is returned: the agent runs independent read-only calls
  together, and dropping later calls reads to the model as calls that never
  happened. One botched fence does not take the batch with it.
- `{"pattern":"a:\s*b"}` is not valid JSON; doubling the illegal backslash
  recovers exactly what the model meant. Such calls are marked
  `__coerced: 'illegal-escape'` so drift is counted.
- Truncation is not repaired here. The agent's loose parser owns repair and
  marks what it repaired, so a mutating call can refuse a partial argument.
