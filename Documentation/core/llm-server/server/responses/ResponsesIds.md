# ResponsesIds

`core/llm-server/server/responses/ResponsesIds.js`

Mints Responses ids.

## Methods

- `responseId(upstreamId)` `resp_<id without chatcmpl->`, or a random one.
- `itemId(prefix)` `<prefix>_<24 hex>` for `msg`, `rs`, `fc` items.
- `callId()` `call_<24 hex>` for a tool call upstream left unnamed.

## Why

Reusing the upstream id traces a response back to the llama-server request.
