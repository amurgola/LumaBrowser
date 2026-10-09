# AiReplyParser

`extensions/game-mode/ai/AiReplyParser.js`

Interprets a model reply under the in-game protocol: `{"tool": ...}`, `{"final": ...}`, a bare JSON value (json mode) or prose. JSON is found with the string-aware [BalancedJson](../../../core/shared/llm/BalancedJson.md) so braces inside dialogue never break a turn.

## Methods

- `clean(text)` drops `<think>` / harmony channel blocks and code fences.
- `firstJsonObject(text)` the first balanced object that parses, or null.
- `parse(raw, { tools, json })` -> `{ kind: tool, name, args, raw }` | `{ kind: final, text, value? }` | `{ kind: invalid, raw, reason }`. An unknown tool name is invalid (nudgeable); prose under tools is final.
- `unwrapTextObject(text)` a one-key text object (or a text key plus scalar tags) becomes its words; seen live with Qwen.
