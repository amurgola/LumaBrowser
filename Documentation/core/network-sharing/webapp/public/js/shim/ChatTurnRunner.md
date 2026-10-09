# ChatTurnRunner

`core/network-sharing/webapp/public/js/shim/ChatTurnRunner.js`

The shim's `chat2`: persists the turn on the device, streams it from the host,
and re-emits it as the requestId-keyed chat event stream the chat expects.

## Methods

- `new ChatTurnRunner({ api, store, events })`: `events` is the
  [SingleListener](SingleListener.md) behind `onChatEvent`.
- `chat2(args)` (the desktop args: `requestId`, `conversationId`, `modelRef`,
  `messages`, `userMessage`, `attachments`, `agent`, `regenerateMessageId`,
  `editMessageId`,
  `reasoningEffort`):
  1. Opens the conversation (creating one when missing).
  2. Regenerate (`regenerateMessageId`, or no `userMessage`) truncates from that
     message and writes no user row; otherwise stores each image attachment as an
     artifact and the user row (`toolCalls: { artifacts }` when any). The device
     keeps no branches, so an edit (`editMessageId`) first truncates from the
     original prompt.
  3. Adds an empty assistant row and patches `{ modelRef, toolsEnabled: !!agent }`.
  4. Emits `meta` `{ conversationId, userMessageId, assistantMessageId, userArtifacts }`.
  5. Streams through `api.chat`: `agentId` from an `agent-chat` conversation's
     meta, image attachments, every stored artifact as `priorArtifacts` (except
     the new assistant row's), the dial from the args or the conversation.
     Emits `delta`, `reasoning-delta` and every side-channel event (folded by
     [TurnRecorder](TurnRecorder.md); new artifacts are fetched and cached).
  6. Saves the assistant message and emits `done` `{ usage, finishReason: 'stop' }`.
  Resolves `{ success, conversationId, assistantMessageId }`. Failures:
  Unauthorized emits `error` `Pairing expired. Reconnect.` and rethrows; an
  AbortError emits `done` `{ aborted: true }` and saves an empty answer (as
  legacy); anything else emits `error`, stores it on the message and resolves
  `{ success: false, error }`.
- `chatAbort()`: aborts the running turn (which also names it to the host).
