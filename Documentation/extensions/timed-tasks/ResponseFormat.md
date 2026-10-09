# ResponseFormat

`extensions/timed-tasks/ResponseFormat.js`

The optional response-prompt contract of a timed task.

## Methods (static)

- `instructionFor(responsePrompt)`: the `FINAL OUTPUT FORMAT (STRICT)` system
  prompt addition ending in `Schema:\n<trimmed prompt>`, or null for a blank prompt.
- `parseJson(text)`: the parsed object or array (a ` ```json ` fence is
  tolerated), or `undefined` for prose, scalars, broken JSON or non-strings.

## Why

The webhook sends `response` as an object when the agent honoured the schema
and as the raw text otherwise, so receivers need no second parse.
