# BackgroundTaskResult

`core/llm-server/chat/tasks/BackgroundTaskResult.js`

Reads what a finished background tool call returned: whether it succeeded, and the text
the model is given for it.

## Methods

- `succeeded(result)`: false only for an object with `success: false`; anything else a
  tool returned counts as a success.
- `text(result)`: the body, clipped. The body is, in order: the `error` of a failed
  result, `message`, `data` when it is a string, else `data` (or the result without
  `DROPPED_KEYS`: `success`, `imageBase64`, `mimeType`, `artifact`, `summary`,
  `toolCatalogChanged`) as indented JSON. An empty object reads as `''`.
- `clip(text)`: text over `MAX_CHARS` (6000) keeps its first `HEAD_CHARS` (1500) and
  its last 4500 characters, with `[... N characters left out ...]` between them.

## Why

The result rides in a user-role message beside the whole conversation
([BackgroundTaskText](BackgroundTaskText.md)`.notice`), so it has to fit. The start and
the end of a long output are kept because a command's outcome is usually at its end and
what it was doing at its start. Image bytes and the bookkeeping keys are of no use to
the model; the pictures themselves are shown to the user as artifacts.
