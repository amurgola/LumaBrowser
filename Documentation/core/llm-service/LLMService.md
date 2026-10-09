# LLMService

`core/llm-service/LLMService.js`

Slot-based LLM routing. Each extension declares named slots (for example
`ai-chat.navigator`); the user binds each slot to a provider + model,
and `sendCompletion` / `createStream` resolve the slot and dispatch, through
[LLMQueueManager](LLMQueueManager.md) when one is attached. The implicit
`default` slot mirrors the global default provider (`llm.provider`).

## Methods

- `new LLMService(db, providers)`; `providers` is `{ openai, anthropic }`
  ([OpenAICompatibleProvider](providers/OpenAICompatibleProvider.md),
  [AnthropicProvider](providers/AnthropicProvider.md)). Public fields `db`,
  `providers`, `slots` (Map), `queueManager`, `browserTools`
  (the [BrowserTools](BrowserTools.md) class, reached by extensions as
  `context.llm.browserTools`).
- Wiring: `setQueueManager(q)`, `getQueueManager()`,
  `setLlmServerService(s)` (needs `computeLocalProviderEntry`, optionally
  `ensureRunning`, `noteLocalRequestStart/End`, `runtimeServer.getStatus()`),
  `setGroundingServerService(g)` (needs `computeProviderEntry`, `ensureRunning`).
- Slots: `registerSlot(slotId, { extensionId, label, required })`,
  `unregisterSlot(slotId)`, `getSlotConfig(slotId)` (explicit config, else the
  default's, else `null`), `setSlotConfig(slotId, provider, model)`,
  `clearSlotConfig(slotId)`, `getAllSlots()` (without `default`).
- Dispatch: `sendCompletion(slotId, messages, options)` returns the provider's
  `{ success, response?, error? }`; `createStream(slotId, messages, options, handlers)`
  returns `{ abort, done }` synchronously.
- `resolveSlot(slotId)` returns `{ provider, modelOverride }` (nulls when the
  slot cannot route). `describeSlot(slotId)` returns
  `{ provider, model, managedLocal }`. `ensureSlotVision(slotId)` returns
  `{ ok, vision, error?, code? }`.
- Providers: `getProvider(key)`, `getProviders()`, `getAllAvailableModels()`,
  `getActiveProviderKey()`, `getActiveProvider()`.
- Constants: `LLMService.DEFAULT_SLOT`, `MANAGED_LOCAL_PROVIDER_ID`
  (`core.llmServer.local`), `GROUNDING_PROVIDER_ID` (`core.groundingServer`).

## Request options

`sessionId` defaults to a per-slot id persisted at
`core.llm.slots.<slotId>.cacheSessionId`, so `prompt_cache_key` groups a
slot's turns across restarts; callers such as AgentRunner override it per
conversation. `sendCompletion` strips two routing hints before the provider
sees the options: `needsVision` (start the local server with its vision
projector) and `label` (the activity panel label, sent to the queue as
`meta.label`). `createStream` passes options through unchanged, as legacy did.

## How a request runs

The queue key is `<provider>::<model>` and `meta.source` is the slot id's
first dotted segment. Inside the queue worker (or directly without a queue)
[SlotRequestRunner](service/SlotRequestRunner.md) starts the managed server
the slot routes to, resolves the provider against its live port, writes any
model override into the options, and calls the provider while
[ManagedServers](service/ManagedServers.md) counts local decode-slot
occupancy. Starting at execution time is why an extension slot pointing at
"Local LLM" works without the user starting the server first. A failed start
returns `{ success: false, error, code, runtimeId, runtimeName, installable }`
so chat UIs can offer a one-click Download.

`createStream` checks for abort before the start and again after it, so an
early abort never opens a provider session; a later abort reaches the open
session's `abort()`.

## Slot resolution

[SlotResolver](service/SlotResolver.md) handles four kinds of provider key:
the managed local server, the grounding server, a stored provider config id
(a Network Sharing peer, or one of several configs of the same type) and a
static provider type key. The first three get cached ephemeral providers from
[EphemeralProviders](service/EphemeralProviders.md) over a
[NonPersistingDb](service/NonPersistingDb.md), so per-call endpoint and model
changes never overwrite the user's saved `lmStudio.*` settings.

## Vision

`ensureSlotVision`: cloud providers are assumed able to see (`vision: null`);
the grounding server always launches with its projector (`vision: true`); a
managed local slot starts (or restarts once) with its projector and reports
`NO_VISION` when the loaded plan has no `mmprojPath`.
