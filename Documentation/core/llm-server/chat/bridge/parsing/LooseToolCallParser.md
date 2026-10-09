# LooseToolCallParser

`core/llm-server/chat/bridge/parsing/LooseToolCallParser.js`

The chat agent's lenient tool-call parser for calls the strict fence matcher missed.

## Methods

- `LooseToolCallParser.parseAll(content)`: every call in model order. The first
  strategy that yields calls wins: JSON (every fence with any label, read by
  balanced braces; an unterminated trailing fence; bare `{"tool": ...}`
  objects, skipping markers inside an accepted call, plus the last unbalanced
  one), then [XmlToolCallParser](XmlToolCallParser.md)`.parseAll`, then
  `.parseLast`, then `HarmonyLeakedToolCallParser.parseAll`.
- `LooseToolCallParser.parseFirst(content)`: the first call or null.
- Each candidate is read by [ToolJson](ToolJson.md); repaired calls carry
  `__repaired`.

## Why

A call ends where its braces balance, not at the next ```, since a markdown
payload opens its own fences. Strategies are alternative shapes of one
message, so mixing them would double-count a call.
