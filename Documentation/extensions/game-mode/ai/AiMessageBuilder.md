# AiMessageBuilder

`extensions/game-mode/ai/AiMessageBuilder.js`

Builds the messages of one in-game AI call: a system message with the game framing (`<game_premise>`, `<world>`), the caller's `<instructions>` and the output protocol, then the trimmed history.

## Methods

- `build({ game, req })`; the protocol is `<game_functions>` with tools, `<output_format>` (with the shape hint) for json, else a prose-only block (without it the model answered `{"response": ...}`).
- `trimHistory(messages)` cleans roles, keeps the newest 60 messages within 32,000 chars, ends on a user turn (`Continue.`), and never returns empty (`Begin.`).
- `toolProtocol(tools, json)`, `jsonProtocol(json)`.
