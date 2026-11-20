# AvailableModels

`core/llm-service/service/AvailableModels.js`

Lists the models an extension slot can pick, for
`LLMService.getAllAvailableModels()`.

## Methods

- `AvailableModels.list({ db, providers, managedEntries })` returns
  `[{ providerId, providerLabel, modelId, label }]`:
  - the user's stored configs (any persisted `managedByCore` row hidden) plus
    the computed `managedEntries`; configs without `models` or `endpoint` are
    skipped; rows dedupe on `providerId::modelId`.
  - `providerId` is the config `type`, except managed entries which keep their
    own `id` so their slots route to them; `providerLabel` is the config
    `name`, else the type label. `label` is "providerLabel: modelId", except a
    managed entry's model with a `luma_label` is labelled by it ("Local · Qwen"),
    since the local entry lists every installed model and its name is only the default's.
  - when that yields nothing, the legacy `<lmStudio|anthropic>.models` lists of
    providers that have an endpoint.
- `AvailableModels.labelFor(type)` and `TYPE_LABELS`
  (`OpenAI-Compatible`, `Anthropic`; other keys echo themselves).
