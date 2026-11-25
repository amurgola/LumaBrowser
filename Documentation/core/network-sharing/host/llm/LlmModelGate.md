# LlmModelGate

`core/network-sharing/host/llm/LlmModelGate.js`

Authorizes a client-requested LLM ref against the toggle-aware manifest the
calling credential sees ([AccessPolicy](../AccessPolicy.md)).

## Methods

- `LlmModelGate.denied(service, model, credential?)`: null when allowed, else
  the 403 message. A `local::` ref passes whenever any local model is shared
  (else `local model is not shared`), unless the credential's user has their
  own model list; any other ref, and every ref for such a user, must be in
  `service.allowedLlmRefs(credential)` (else `model is not available`).
- `LlmModelGate.modelList(service, credential?)`: the OpenAI list `{ object: 'list', data }`
  over the manifest's LLMs, each `{ id, object: 'model', owned_by:
  'lumabrowser', created: 0, luma_label, luma_kind, luma_current }`.

## Why

A local ref gone stale between manifest polls then fails downstream with a
clear "not found" instead of a confusing 403.
