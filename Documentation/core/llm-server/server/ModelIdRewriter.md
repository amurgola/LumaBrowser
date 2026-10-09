# ModelIdRewriter

`core/llm-server/server/ModelIdRewriter.js`

A stream transform that replaces the value of every `"model": "..."` field with
the id clients were shown.

## Methods

- `ModelIdRewriter.create(modelId)` returns a `Transform`. Input is buffered per
  line: complete lines are rewritten and passed on, the trailing partial line is
  held until its newline or the end of the stream. The new id is JSON-escaped;
  escaped quotes inside the old value are handled.
- `ModelIdRewriter.MODEL_FIELD` is the matching regex.

## Why

llama-server reports the model as the file path it was launched with, while
clients expect the id `/v1/models` listed. Rewriting per line works for one JSON
document (no newlines inside the value) and for SSE, where each `data:` line is
a complete JSON object, and leaves every other byte of the stream untouched.
