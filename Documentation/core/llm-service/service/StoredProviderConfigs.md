# StoredProviderConfigs

`core/llm-service/service/StoredProviderConfigs.js`

Reads the user's persisted provider configs (`llm.providerConfigs`) for slot
routing.

## Methods

- `StoredProviderConfigs.userConfigs(db)`: the list without any persisted
  `managedByCore` row (an old version may have saved one).
- `StoredProviderConfigs.findById(db, id)`: the user config with that id and
  an endpoint, else `null`. The type keys `none`, `openai`, `anthropic`
  (`TYPE_KEYS`) never match, so they always route to the static providers.
- `StoredProviderConfigs.defaultModelOf(config)`: `selectedModel`, else the
  first listed model id, else `null`.
