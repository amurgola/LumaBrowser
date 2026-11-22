# LocalRequest

`core/llm-server/chat/router/LocalRequest.js`

Sends one chat request to the ready local server through its runtime's chat adapter, counted in the service's shared in-flight tally.

## Methods

- `new LocalRequest({ llmServerService, runtimeCatalog, adapterRegistry })`.
- `send(messages, temperature, hooks, images, tools, extra, log)` returns the adapter handle with an abort that also settles the count. Throws `Local server is <state>, not ready.` (nothing counted) and `Catalog entry for <id> not found.`. Images: `MessageImages.inject` with a loaded projector, else `noteNotVisible`. The adapter is the catalog entry of the running plan's runtime (`getStatus().plan.runtimeId`), else of the stored `getDefaults().runtimeId` for a plan that names none (the helper model's facade reports no plan and names its own runtime there). Adapter options: `baseUrl` from the live host and port, `apiKey` the supervisor's `authKey`, `model` the plan's `apiModelName`, and for a runtime without a catalog request profile `request: RequestProfile.fromThinking(getRunningThinking())` when one exists. Emits `{ phase: 'waiting-for-slot', inFlight, slots }` when `getLocalInFlight() >= getLocalSlotCount()`. Native tool-call fragments are forwarded to `hooks.onToolCallDelta` when the caller has one. Body: `familySamplerDefaults` (`FamilySampler.forTurn`), `samplerOverrides` (`extra.samplerOverrides` when it is an object: a chat mode's own llama-server sampler keys, winning over the family's where they overlap), `tools` (omitted when empty), `parallelToolCalls` (`!!extra.parallelToolCalls`), `chatTemplateKwargs`, `reasoningBudget`, `maxTokens` (`RequestSettings.maxTokens(extra)`: the smaller of the agent loop's `extra.maxTokens` and the user's Tune cap `extra.maxReplyTokens`), `moeCacheBatch` ([RequestComplexity](../RequestComplexity.md)`.moeCacheBatch(extra, tools)`: 128 for a heavy request, so its short prompts keep reading the local server's expert cache; undefined otherwise). The count settles once on done, error or abort; done also marks the supervisor active.

## Why

Chat, sharing proxies and extension slots all dispatch at the same decode slots; a request into a saturated server would otherwise sit silently in llama-server's FIFO. The bearer is the running child's snapshot, so a key rotation mid-run is safe. The adapter follows the running plan for the same reason: the server speaks the protocol of the runtime it was started on, whatever has been saved since.

## Changes (2026-11-09, helper model)

`extra.responseFormat` reaches the adapter as `responseFormat` (the roleplay stage manager's schema).

The model's own sampler (`extra.modelSampler`) is merged over a chat mode's
sampler overrides: where both name a knob, the model's value is sent.
