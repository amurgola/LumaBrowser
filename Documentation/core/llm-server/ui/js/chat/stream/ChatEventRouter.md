# ChatEventRouter

`core/llm-server/ui/js/chat/stream/ChatEventRouter.js`

Routes the in-flight turn's chat events (only those for the current request id):

| Type | Effect |
|---|---|
| `meta` | adopts the conversation id (only while the pending thread is on screen), shows a landing send's new row in the sidebar now, tags the live turn with its message id, adopts the user turn's id (stamped on its element, so Edit appears) and image artifacts |
| `status` | the pre-speech line ([StatusText](StatusText.md)) unless text already streamed; `compacted` drops one divider pill above the turn |
| `delta`, `reasoning-delta`, `rollback` | the message text, voice, the sink, the scheduled pass |
| `tool` | [ToolEventReducer](ToolEventReducer.md); window `luma-chat-tool` for approval, run and done; a frozen tab releases the slot and is cached |
| `artifact-stream`, `artifact` | the panel (only while the stream's conversation is on screen; live modules stay inline), the artifact views and count |
| `done`, `error` | usage, timings, then [StreamFinisher](StreamFinisher.md) |
| `agent` | [AgentEventReducer](AgentEventReducer.md) |
| anything else | the active mode's `onChatEvent(event, ctx)` with DOM helpers, while its conversation is on screen |

## Methods

- `handle(event)`.
