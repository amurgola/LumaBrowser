# TimingsUsage

`core/llm-server/server/chat/TimingsUsage.js`

Synthesises an OpenAI-shaped usage object from llama.cpp's streamed `timings`,
for servers that send no `usage` chunk, so the chat's context meter always has a
token figure.

## Methods

- `TimingsUsage.fromTimings(timings)` returns
  `{ prompt_tokens, completion_tokens, total_tokens }` from `prompt_n` (prompt
  tokens evaluated) and `predicted_n` (tokens generated). A missing or invalid
  half counts as 0; `null` when neither is a non-negative number, so callers
  keep "unknown".
