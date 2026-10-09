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
- `ensureReady(config, { withVision })` returns `{ ok, error?, code?, runtimeId?, runtimeName?, installable? }`.
  Non-managed providers and a local service without `ensureRunning` are `{ ok: true }`.
  `withVision` is passed as `ensureRunning({ withVision: true })`, else
  `ensureRunning(undefined)`. A missing grounding service is an error.
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
