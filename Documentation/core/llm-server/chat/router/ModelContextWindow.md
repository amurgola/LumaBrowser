# ModelContextWindow

`core/llm-server/chat/router/ModelContextWindow.js`

Resolves the per-request context budget for a specific provider and model.

## Methods

- `resolve(ref, { signal, onStatus })`: fresh asynchronous resolution before each turn. Returns a frozen `{ tokens, source, estimated, notice? }` snapshot. Managed local refs retain `getEffectiveContext().ctxPerSlot`; external OpenAI-compatible providers use [BackendContextProbe](BackendContextProbe.md).
- No detected allocations are cached across turns. Changes to backend configuration, endpoint, credentials, or model are picked up on the next turn. A failed lookup never reuses an old allocation or this machine's local runtime defaults.
- `llm.providerConfigs[].contextWindows[modelId]` is an optional positive integer budget. It is a fallback when detection is unavailable and a cap when smaller than a detected allocation. It never changes the backend's configuration.
- Unknown context uses an explicitly estimated 4096-token safety budget with a user-facing notice. This is not reported as the model's actual context. Model training limits and maximum output tokens are not allocation metadata.
- `forRef(ref)` is the synchronous legacy metadata lookup: local per-slot context, or the saved custom/advertised `luma_context` (the smaller if both exist), else null. It performs no network requests or model loads.
- `budgetFor(ref)` adds the explicit safety fallback to `forRef`. Remote refs never fall back to `localPerSlot()`.
- `localPerSlot()` returns the managed server's effective per-slot context when positive, otherwise null.

ChatTurn passes the same resolved snapshot to compaction, the agent bridge's tool/reply budgets, and stream metadata. Shared agent turns resolve independently. The backend can still be reconfigured externally during a turn; detection is a pre-turn observation, not a reservation of backend capacity.
