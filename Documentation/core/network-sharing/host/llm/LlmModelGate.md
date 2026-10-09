# LlmModelGate

`core/network-sharing/host/llm/LlmModelGate.js`

Authorizes a client-requested LLM ref against the host's toggle-aware manifest.

## Methods

- `LlmModelGate.denied(service, model)`: null when allowed, else the 403
  message. A `local::` ref passes whenever any local model is shared (else
  `local model is not shared`); any other ref must be in
  `service.allowedLlmRefs()` (else `model is not available`).
- `LlmModelGate.modelList(service)`: the OpenAI list `{ object: 'list', data }`
  over the manifest's LLMs, each `{ id, object: 'model', owned_by:
  'lumabrowser', created: 0, luma_label, luma_kind, luma_current }`.

## Why

A local ref gone stale between manifest polls then fails downstream with a
clear "not found" instead of a confusing 403.
