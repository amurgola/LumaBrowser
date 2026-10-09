# ModelDispatcher

`core/llm-server/chat/router/ModelDispatcher.js`

The one choke point every chat model call passes through.

## Methods

- `new ModelDispatcher({ db, localStream, remoteStream })`.
- `async dispatch(modelRef, messages, temperature, hooks, images = [], tools = null, extra = null)` resolves the call's abort handle. `extra.trace` (`{ conversationId, turnId, callType }`) is peeled off and never reaches an adapter; an extra holding only the tag becomes null, an untagged null stays null. With `LlmTrace.enabled(db)` the hooks are wrapped by `LlmTrace.instrument` (untagged calls as `UNTAGGED`, callType `side`); a trace failure uses the plain hooks. Local refs go to `localStream.stream(stem, ...)`; remote refs to the matching non-`managedByCore` config in `llm.providerConfigs` (images injected as parts), or reject with `Provider "x" is no longer configured in settings.` / `Malformed modelRef "x"`.

## Why

Chat turns, agent steps, compaction, titles, side completions and sharing proxies all route here, so the trace and the routing rules exist once.
