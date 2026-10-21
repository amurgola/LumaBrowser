# LlmTransform

`extensions/site-apis/runtime/LlmTransform.js`

The `llm_transform` step: the current result JSON and the instruction go to the app's text model through
`context.chat.complete`, the JSON it answers becomes the new result.

## Methods

- `new LlmTransform({ chat, logger })`.
- `apply(step, result, { timeoutMs })` -> the new result. `chat.complete({ messages: [system, user], temperature: 0,
  noThink: true, timeoutMs, trace: 'site-apis:llm_transform' })`. Throws a plain Error without a chat service, on
  an error reply, on an input over `MAX_INPUT_CHARS` (120000) or on an unparsable reply.
- `LlmTransform.prompt(step, inputJson)`: instruction, optional `returns` hint, the JSON.
- `LlmTransform.parse(text)`: the first balanced object (`core/shared/llm/BalancedJson.extractObject`, so braces
  inside strings and code fences do not cut it short); its `result` member when present, else the object.

## Decisions

The model is asked for `{"result": ...}` rather than bare JSON because `BalancedJson` extracts objects; a bare
list reply would need a second scanner.
