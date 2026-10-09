# UpstreamChatRequest

`core/llm-server/server/relay/UpstreamChatRequest.js`

Posts one chat-completions body to the running llama-server, plus helpers for
reading its reply.

## Methods

- `UpstreamChatRequest.open(upstream, body, { onResponse, onError })` posts
  JSON to `/v1/chat/completions` on `upstream.baseUrl` (http or https) with
  `Accept: text/event-stream` when `body.stream`, else `application/json`, and
  `Authorization: Bearer <apiKey>` when set. Returns the request, or `null`
  after calling `onError(Bad upstream URL: ...)` for an invalid base URL.
- `UpstreamChatRequest.collect(response, onText)` reads the whole body as UTF-8.
- `UpstreamChatRequest.isFailure(response)` is true for no status or >= 400.
- `UpstreamChatRequest.errorText(raw, status)` returns the JSON `error.message`
  (or `error`), else the raw body, else `upstream <status>`.
- `UpstreamChatRequest.parseJson(raw)` returns the parsed value or `null`.
- `UpstreamChatRequest.unreachableMessage(error)` returns
  `Could not reach the local model server: <message>`.

## Why

Unlike [UpstreamProxy](../UpstreamProxy.md), which pipes bytes through, the
translated routes (Messages, Responses) must read and translate the reply, so
they need the raw response. It lives in relay/ because both share it through
[TranslatedChatStream](TranslatedChatStream.md) and [TranslatedChatCompletion](TranslatedChatCompletion.md).
