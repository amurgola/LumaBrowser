# ModelDispatcher

`core/llm-server/chat/router/ModelDispatcher.js`

The one choke point every chat model call passes through.

## Methods

- `new ModelDispatcher({ db, localStream, remoteStream, modelSettings = null })`; `modelSettings` is [ModelSettings](../../service/ModelSettings.md).
- `async dispatch(modelRef, messages, temperature, hooks, images = [], tools = null, extra = null)` resolves the call's abort handle. `extra.trace` (`{ conversationId, turnId, callType }`) and `extra.settingsRef` are peeled off and never reach an adapter; an extra holding only those becomes null, an untagged null stays null. With `modelSettings`, the ref is resolved (a `profile::` ref routes on its base; a deleted profile rejects before anything is sent) and the overrides of `settingsRef` (when it differs from the ref) or else of the ref are applied by [RequestSettings](RequestSettings.md) with the tag's callType. Without it, refs route as given and nothing is applied. With `LlmTrace.enabled(db)` the hooks are wrapped by `LlmTrace.instrument` (untagged calls as `UNTAGGED`, callType `side`); a trace failure uses the plain hooks. Local refs go to `localStream.stream(stem, ...)`; remote refs to the matching non-`managedByCore` config in `llm.providerConfigs` (images injected as parts), or reject with `Provider "x" is no longer configured in settings.` / `Malformed modelRef "x"`.

## Why

Chat turns, agent steps, compaction, titles, side completions and sharing proxies all route here, so the trace, the routing rules and the per-model and profile overrides exist once. A profile ref can arrive from any of them (an agent pinned to one, the remembered pick a side completion falls back to), not only from a chat turn.
