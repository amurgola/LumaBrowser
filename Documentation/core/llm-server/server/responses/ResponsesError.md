# ResponsesError

`core/llm-server/server/responses/ResponsesError.js`

OpenAI-shaped errors for the Responses route, and the failure code Codex acts on.

## Methods

- `send(res, status, type, message, { code, param })` answers
  `{ error: { message, type, param, code } }`; `body(...)` builds it.
- `failure(message)` the `{ code, message }` of a failed response; code is
  `codeFor(message)` or `server_error`.
- `codeFor(message)` `context_length_exceeded` when the message reads like a
  context overflow (`CONTEXT_PATTERN`: "context size/length/window",
  "exceeds the available context", "n_ctx"), else `null`.

## Why

Codex maps `context_length_exceeded` to its context-window error (and can
compact); anything else it treats as a retryable stream error.
