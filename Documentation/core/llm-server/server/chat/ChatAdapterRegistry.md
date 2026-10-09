# ChatAdapterRegistry

`core/llm-server/server/chat/ChatAdapterRegistry.js`

Maps a runtime catalog entry's `protocol` to the [ChatAdapter](ChatAdapter.md)
class that speaks its wire format, so no caller grows a per-protocol switch. The
LLM twin of [ImageAdapterRegistry](../../../image-server/server/image/ImageAdapterRegistry.md).

## Methods

- `ChatAdapterRegistry.createAdapterFor(runtimeEntry, opts)` returns
  `new AdapterClass({ ...opts, request: opts.request || entry.request })`.
  A missing entry or protocol means `openai-compat`; an entry `request` that is
  not an object is ignored. Throws
  `No chat adapter registered for protocol "<p>" (runtime <id>).` for an
  unknown protocol.
- `ChatAdapterRegistry.listProtocols()` `['openai-compat']`.
- `ChatAdapterRegistry.DEFAULT_PROTOCOL`, `ChatAdapterRegistry.ADAPTERS`
  (frozen, keyed by each class's `protocolId`). New adapters are added there.

## Why

Failing at adapter creation beats a 500 deep inside the chat loop. The entry's
request profile (where the thinking dial lives, which sampler fields exist)
rides along so callers need not know about dialects such as NInfer's.
