# ToolFenceStripper

`core/llm-server/chat/bridge/parsing/ToolFenceStripper.js`

Removes tool-call text from prose the user sees.

## Methods (all static)

- `stripDebris(text)`: drops ```tool fences, `<tool_call>` and `<function=...>`
  regions (closed or dangling) and trailing backticks/space, for commentary
  diverted to the thinking pane.
- `stripLeaked(text)`: `{ text, removed }`. Removes fenced blocks whose body
  starts with `{` and has `"tool"` and `"params"` keys (closed, or
  unterminated at the tail) and XML regions that carry `{` or `<parameter`.
  Ordinary code and prose about the format survive.
