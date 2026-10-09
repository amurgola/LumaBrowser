# SlotConfigStore

`core/llm-service/service/SlotConfigStore.js`

Persists each slot's explicit provider + model and its prompt-cache session id
under `core.llm.slots.<slotId>.{provider,model,cacheSessionId}`.

## Methods

- `new SlotConfigStore(db)`.
- `explicitConfig(slotId)`: `{ provider, model }` when both are set, else `null`.
- `set(slotId, provider, model)`, `clear(slotId)` (removes provider and model).
- `sessionId(slotId)`: the stored id, or a new `s_<time36>_<random>` saved on
  first use, so a slot shares the server prompt cache across restarts.
