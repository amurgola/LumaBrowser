# ChatEventRouter

`core/llm-server/ui/js/chat/stream/ChatEventRouter.js`

Routes chat events: the turn's own (only those for the request in flight) and a mode's (matched to the conversation their turn ran in):

| Type | Effect |
|---|---|
| `meta` | adopts the conversation id (only while the pending thread is on screen), shows a landing send's new row in the sidebar now, tags the live turn with its message id, adopts the user turn's id (stamped on its element, so Edit appears), image artifacts and recorded edit regions (`userRegions` onto `toolCalls.editRegions`) |
| `status` | the pre-speech line ([StatusText](StatusText.md)) unless text already streamed; `compacted` drops one divider pill above the turn |
| `delta`, `reasoning-delta`, `rollback` | the message text, voice, the sink, the scheduled pass; the first reasoning delta starts the pane's clock (`_reasonStart`), each one moves `_reasonAt` |
| `tool` | [ToolEventReducer](ToolEventReducer.md); before any text, a status line in the body gives way to the plain pulse (the chain is the progress now); window `luma-chat-tool` for approval, run and done; a frozen tab releases the slot and is cached |
| `artifact-stream`, `artifact` | the panel (only while the stream's conversation is on screen; live modules stay inline), the artifact views and count |
| `done`, `error` | usage (a `completion_tokens_details.reasoning_tokens` count lands on the message as `reasoningTokens` for the pane), timings, then [StreamFinisher](StreamFinisher.md) |
| `agent` | [AgentEventReducer](AgentEventReducer.md); a `start` naming a `conversationId` (a delegation) refreshes the sidebar so the sub-conversation nests at once |
| `plan` | [PlanPanel](../plan/PlanPanel.md)`.onEvent({ conversationId, plan })`: the conversation's plan after an `update_plan` call, or null once it is cleared or retired |
| anything else | the active mode's `onChatEvent(event, ctx)` with DOM helpers, while the conversation the event's turn ran in ([ChatState](../ChatState.md)`.conversationOfRequest`) is the one on screen; not tied to the request in flight or to a live stream |

## Methods

- `handle(event)`. A turn event of another request is not dropped when
  [HostTurns](HostTurns.md)`.begin(requestId)` takes it: the first event of a turn the
  host started by itself (a background task's results) makes that request the turn in
  flight, and the event is then handled as the turn's own.

## Changes (2026-11-14, mode events after the turn)

A mode's post-turn reaction (a roleplay's world update, activity line and images; a game's queued assets) sends its events after the turn's `done`, sometimes after the next turn has started. `_modeEvent` required `streamOnScreen()`, which is false from the moment `done` is handled, and `handle` required the request in flight, so every one of those events was dropped. The page never showed a reply's world update until the conversation was reopened, and its copy of the mode's data went stale: the next thing the page saved (a gear setting, a removed turn) wrote that stale copy over what the reaction had stored. Mode events are now matched through `state.conversationOfRequest(evt.requestId)` and delivered while that conversation is the active one. `_adoptConversation` records the request's conversation for a landing send.

## Adopting the conversation

The `meta` event names the turn's conversation. It becomes the conversation on screen only when this turn
minted it (a send from the landing, where the stream had no conversation yet). A turn whose conversation was
known from the start, such as one the host began while a scheduled task or trigger view is up, is tracked
but never adopted as the open conversation.
