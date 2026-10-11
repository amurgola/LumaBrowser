# ProxyTurns

`core/llm-server/chat/router/ProxyTurns.js`

Turns run for a paired Network Sharing client: never persisted, never touching the host user's in-flight turn.

## Methods

- `new ProxyTurns({ llmServerService, dispatch, agentBridge, getAgentDeps, reclaimer, contextWindow })`.
- `async stream({ modelRef, messages, temperature, hooks, images = [], extra = null })`: dispatches with trace `{ conversationId: null, callType: 'sharing' }`; resolves the wrapped handle.
- `agent({ modelRef, messages, temperature, hooks, images, priorArtifacts, allowedTools, extra, modeSystemPrompt, kbScope })`: `agentBridge.run` with ephemeral `web_...` conversation and message ids, `priorMessages` carrying the client's artifacts, `llmExtra: extra`; returns an immediately cancellable wrapped handle. Context is resolved before starting the bridge and supplied as `ctxPerSlot`; `ready` settles after preparation and `done` follows the bridge completion. Aborting preparation prevents bridge startup; fallback notices are emitted as status events. Throws the not-ready error without the browser.
- `resolveRef(ref)`: remote refs unchanged; `local::<stem>` unchanged; bare `local::` -> the host's selected model; any local ref throws `No local model is configured on the host.` without one.
- `wrapHandle(ref, handle)`: idempotent abort that also reclaims the slot for a local ref.

## Why

The client owns its history. The sharing route fires abort from both its socket-close handler and its abort endpoint.
