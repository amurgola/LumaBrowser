# ManagedServers

`core/llm-service/service/ManagedServers.js`

[LLMService](../LLMService.md)'s link to the two core-managed llama-servers:
the local LLM server (`core.llmServer.local`) and the grounding server
(`core.groundingServer`).

## Methods

- `new ManagedServers()`; public fields `llmServerService` and
  `groundingServerService` (set by LLMService's setters).
- `ManagedServers.isManaged(providerKey)`: true for either managed id.
- `localEntry()`, `groundingEntry()`: the live provider entry, recomputed on
  every call; `null` when the service is missing, lacks the method, returns
  nothing or throws.
- `localConnection()`: `{ baseUrl, apiKey, model }` of the local server while
  it is serving
  ([LocalServerConnection](../../llm-server/server/LocalServerConnection.md)`.ofReady`
  over the service's `runtimeServer`), else `null`; also `null` without a
  service or when the read throws. `model` is the name the running runtime
  answers to, which the entry (the installed file's name) does not know.
- `ensureReady(config, { withVision })` returns `{ ok, error?, code?, runtimeId?, runtimeName?, installable? }`.
  Non-managed providers and a local service without `ensureRunning` are `{ ok: true }`.
  The local server gets `ensureRunning({ withVision?, model? })`: `withVision: true`
  when asked, and `model` when the slot's model differs from the entry's
  `selectedModel` (so it loads that installed model); `undefined` when neither.
  A missing grounding service is an error.
- `refreshLocalModels()`: awaits `freshInstalledChatModels()` so the local entry's
  model list is current before a picker reads it; a failed scan keeps the last list.
- `track(config, fn)` awaits `fn()` with `noteLocalRequestStart/End` around it
  when the config routes to the local server; the count settles on throw.
- `localHasVision()`: the local runtime's current plan has an `mmprojPath`.
- Constants: `LOCAL_ID` (`ProviderConfigService.MANAGED_LOCAL_ID`),
  `GROUNDING_ID` ([GroundingServerService](../../grounding-server/GroundingServerService.md)`.PROVIDER_ID`),
  `NO_VISION_MESSAGE`.

## Why

The ids are not stored providers: their endpoints are dynamic local ports
owned by the server features. `track` exists because chat paths bypass the
queue and need one shared in-flight counter to show "Waiting for processing".
