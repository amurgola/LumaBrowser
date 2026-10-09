# CappedBodyReader

`core/llm-server/chat/safe-fetch/CappedBodyReader.js`

Reads one HTTP response body up to a byte cap for [SafeFetch](../SafeFetch.md).

## Methods

- `CappedBodyReader.read(res, { url, maxBytes })` resolves
  `{ ok: true, status, finalUrl: url, contentType, body, truncated }` or
  `{ ok: false, error: 'Read error: <reason>' }`. Past `maxBytes` it keeps
  exactly `maxBytes`, sets `truncated`, and destroys the response so the
  download stops. The body is decoded with
  [ResponseCharset](ResponseCharset.md)`.encodingFor(content-type)`.

## Why

A destroyed stream emits `close` but not `end`, so `close` also finishes the
read when something was collected.
