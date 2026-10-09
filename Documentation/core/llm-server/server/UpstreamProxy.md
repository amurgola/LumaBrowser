# UpstreamProxy

`core/llm-server/server/UpstreamProxy.js`

Forwards one JSON POST to the running llama-server and streams its reply back.

## Methods

- `UpstreamProxy.forward({ req, res, upstream, path, body, log })` where
  `upstream` is `{ baseUrl, apiKey?, modelId }`:
  - posts `body` as JSON to `path` on `baseUrl` (http or https), forwarding the
    client's `Accept` and adding `Authorization: Bearer <apiKey>` when set;
  - copies the upstream status and content type; for `text/event-stream` also
    sets no-cache, keep-alive and `X-Accel-Buffering: no` and flushes headers;
  - pipes the body through [ModelIdRewriter](ModelIdRewriter.md) when a
    `modelId` is known;
  - a bad base URL answers 502 `Bad upstream URL: ...`; an unreachable server is
    logged and answers 502 `Could not reach the local model server: ...` (or just
    ends the response if headers already went out);
  - the client closing early destroys the upstream request.

## Why

SSE and plain JSON ride the same pipe, so a streaming client sees exactly the
chunks llama-server wrote. Tearing down the upstream request on disconnect stops
the model generating for nobody.
