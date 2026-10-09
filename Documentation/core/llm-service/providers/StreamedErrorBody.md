# StreamedErrorBody

`core/llm-service/providers/StreamedErrorBody.js`

## Methods

- `StreamedErrorBody.materialize(error)`: when `error.response.data` is a
  stream (axios with `responseType: 'stream'`), reads it and replaces it with
  the parsed JSON, or `{ error: { message: text } }` for non-JSON. Returns the
  error; read failures leave it unchanged.

## Why

Without this, the one line the user needs ("invalid x-api-key", "max_tokens:
... exceeds ...") read as undefined and every streaming failure surfaced as
"Request failed with status code 400".
