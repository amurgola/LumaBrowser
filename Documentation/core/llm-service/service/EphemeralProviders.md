# EphemeralProviders

`core/llm-service/service/EphemeralProviders.js`

Builds and caches the providers LLMService points at endpoints other than the
two static singletons. All are created over a
[NonPersistingDb](NonPersistingDb.md), so their per-call setters never save.

## Methods

- `new EphemeralProviders(db)`.
- `forManagedLocal(entry, model)`: one cached OpenAICompatibleProvider set to
  the entry's endpoint and api key, `setManagedLocal(true)`, and `model`.
- `forGrounding(entry)`: a second cached provider, no api key, managed-local,
  the entry's `selectedModel`.
- `forStoredConfig(config)`: one provider per config id (AnthropicProvider for
  `type: 'anthropic'`, else OpenAICompatibleProvider) set to the config's
  endpoint and api key; `null` without an endpoint. Not managed-local.

## Why

`setManagedLocal(true)` unlocks the llama.cpp-only body knobs (bug H8). Only
our own servers get it: a sharing peer is someone else's llama-server behind a
proxy that applies its own sampling. Endpoints are re-applied on every call
because the local port shifts (8080-8099) between restarts.
