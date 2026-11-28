# ProxyTurns

`core/llm-server/chat/router/ProxyTurns.js`

Turns run for a paired Network Sharing client: never persisted, never touching the host user's in-flight turn.

## Methods

- `new ProxyTurns({ llmServerService, dispatch, agentBridge, getAgentDeps, reclaimer, contextWindow, plainPrompt })`.
- `async stream({ modelRef, messages, temperature, hooks, images = [], extra = null, chatStyle = null })`: dispatches with trace `{ conversationId: null, callType: 'sharing' }`; resolves the wrapped handle. `chatStyle` (`{ choicesOn, voiceOn }`) marks a web chat turn, whose messages get the desktop plain-turn prompt (`ChatStyleDocs.plainTurn` with `plainPrompt`); other callers are sent verbatim.
- `agent({ modelRef, messages, temperature, hooks, images, priorArtifacts, allowedTools, extra, modeSystemPrompt, kbScope, clientConversationId, plan, mediaModels, choicesOn, voiceOn })`: runs through [GuestTurnDispatch](GuestTurnDispatch.md) with an ephemeral `web_...` run id, `priorMessages` carrying the client's artifacts and the host's Tune budget for the model (`ChatTurn._modelBudget`); returns the wrapped handle (keeping `done`). Throws the not-ready error without the browser.
- `resolveRef(ref)`: remote refs unchanged; `local::<stem>` unchanged; bare `local::` -> the host's selected model; any local ref throws `No local model is configured on the host.` without one.
- `wrapHandle(ref, handle)`: idempotent abort that also reclaims the slot for a local ref.

## Why

The client owns its history. The sharing route fires abort from both its socket-close handler and its abort endpoint.

## Changes (2026-11-14, a client's side call)

`stream` tags the dispatch `callType: 'side'` when the client pinned its temperature (`extra.pinTemperature`, read from the body by [ClientRequestKnobs](../../../network-sharing/host/llm/ClientRequestKnobs.md)), `'sharing'` otherwise (`_callType`). A pinned call is one of the client's side calls (a roleplay bookkeeping call asking for 0.2): as a side call the host's own Tune temperature for the model leaves it alone ([RequestSettings](RequestSettings.md) `HOUSEKEEPING`), as it would on the client's own server.

## Changes (2026-11-14, the call's kind is named, not inferred)

`_callType` reads `extra.clientCallType` (`side`, `title`, `compact`, sent by the client as `luma_call_type`) and is `'sharing'` otherwise. The first version inferred a side call from a pinned temperature, but the client's agent loop pins its temperature too, and such a step then escaped the host's Tune temperature, which the host's own agent step does not.

`agent` runs with `withholdTools: HostOnlyTools.isHostOnly`: a turn run for someone else never gets the terminal tools.
It also runs with `forGuest: true`, so [GuestTargetGuard](../bridge/tools/GuestTargetGuard.md) refuses any call that
names, or targets a tab showing, the host computer's own addresses, local files or internal pages.

## Changes (2026-11-25, web turns match the LLM tab)

`agent` no longer calls the bridge bare: [GuestTurnDispatch](GuestTurnDispatch.md) gives a shared turn the chat
assistant's role, answering guidance, native history, context window and `update_plan`, as the host's own chat
turn has. `stream` gives a web chat's plain turn the desktop chat's prompt.

## Changes (2026-11-26, a paired client's pictures count as images)

`stream` runs the messages through [MessageImages](MessageImages.md)`.lift` and dispatches the lifted images after
any sent beside the messages (`images`, the web app's attachments). A paired desktop client puts a turn's pictures
inside its newest user message as `image_url` parts, so the host used to dispatch a turn with no images: the local
path loads the vision projector only for a turn that has some (`LocalServerPrep.prepare(stem, images.length)`), so
the model server stayed without image input and answered HTTP 400 ("started without image input"). With the images
lifted, the host restarts with vision and injects them again, or appends the no-vision note when the model has no
projector, as it does for a picture attached in its own chat. A text turn is dispatched with the same messages
array as before.
