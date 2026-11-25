# SlotResolver

`core/llm-service/service/SlotResolver.js`

Turns a slot config `{ provider, model }` into `{ provider, modelOverride,
requestModel? }`
for [LLMService](../LLMService.md), and computes the implicit default slot's
config.

## Methods

- `new SlotResolver({ db, providers, managedServers, ephemeralProviders })`.
- `resolve(config)`, in order:
  1. managed local id: the local entry's ephemeral provider; model is the
     slot's model or the entry's `selectedModel`; nulls when there is no entry.
     While the server is serving (`managedServers.localConnection()`), the
     provider is bound to its live address and launch key instead of the
     entry's, and `requestModel` is the name the running runtime answers to
     when it has one (Basalt's alias). `modelOverride` stays the installed
     model's own name: it is what the slot is bound to and what
     `describeSlot` shows.
  2. grounding id: the grounding entry's provider and `selectedModel`.
  3. a stored config id ([StoredProviderConfigs](StoredProviderConfigs.md)):
     an ephemeral provider for it; model is the slot's, else the config's
     selected or first model, and is set on the provider.
  4. a static provider key: that provider; `modelOverride` only when the
     slot's model differs from the provider's own selected model.
  Anything else, or an empty config, is `{ provider: null, modelOverride: null }`.
- `defaultConfig()` reads `llm.provider`: `none` is `null`; the local id uses
  the entry's selected model; a stored config id uses its default model; a type
  key uses the provider's selected model. No model means `null`.
- `SlotResolver.UNRESOLVED` (frozen nulls; `resolve` returns fresh copies).
