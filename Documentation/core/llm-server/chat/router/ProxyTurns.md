# ProxyTurns

`core/llm-server/chat/router/ProxyTurns.js`

Turns run for a paired Network Sharing client: never persisted, never touching the host user's in-flight turn.

## Methods

- `new ProxyTurns({ llmServerService, dispatch, agentBridge, getAgentDeps, reclaimer })`.
- `async stream({ modelRef, messages, temperature, hooks, images = [], extra = null })`: dispatches with trace `{ conversationId: null, callType: 'sharing' }`; resolves the wrapped handle.
- `agent({ modelRef, messages, temperature, hooks, images, priorArtifacts, allowedTools, extra, modeSystemPrompt, kbScope })`: `agentBridge.run` with ephemeral `web_...` conversation and message ids, `priorMessages` carrying the client's artifacts, `llmExtra: extra`; returns the wrapped handle (keeping `done`). Throws the not-ready error without the browser.
- `resolveRef(ref)`: remote refs unchanged; `local::<stem>` unchanged; bare `local::` -> the host's selected model; any local ref throws `No local model is configured on the host.` without one.
- `wrapHandle(ref, handle)`: idempotent abort that also reclaims the slot for a local ref.

## Why

The client owns its history. The sharing route fires abort from both its socket-close handler and its abort endpoint.

## Changes (2026-11-14, a client's side call)

`stream` tags the dispatch `callType: 'side'` when the client pinned its temperature (`extra.pinTemperature`, read from the body by [ClientRequestKnobs](../../../network-sharing/host/llm/ClientRequestKnobs.md)), `'sharing'` otherwise (`_callType`). A pinned call is one of the client's side calls (a roleplay bookkeeping call asking for 0.2): as a side call the host's own Tune temperature for the model leaves it alone ([RequestSettings](RequestSettings.md) `HOUSEKEEPING`), as it would on the client's own server.

## Changes (2026-11-14, the call's kind is named, not inferred)

`_callType` reads `extra.clientCallType` (`side`, `title`, `compact`, sent by the client as `luma_call_type`) and is `'sharing'` otherwise. The first version inferred a side call from a pinned temperature, but the client's agent loop pins its temperature too, and such a step then escaped the host's Tune temperature, which the host's own agent step does not.

`agent` runs with `withholdTools: HostOnlyTools.isHostOnly`: a turn run for someone else never gets the terminal tools.
