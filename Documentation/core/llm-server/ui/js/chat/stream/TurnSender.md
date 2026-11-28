# TurnSender

`core/llm-server/ui/js/chat/stream/TurnSender.js`

Starts turns. A send takes the composer text plus staged attachments (images
with the area marked on each, and the areas marked on earlier images as
`kind: 'region'` entries) and (with typed text) the editor chips, renders the user turn (from the landing it becomes
the conversation, titled after the text or the first image), opens the live turn
and calls `api.chat2`. A regenerate replaces a reply in place as a new variant:
no user message is re-sent, later turns are dropped from the context, and the
user turn's images are re-forwarded so a rerun keeps vision. A resend (edit and
resend a prompt) is the same shape on the user side: the thread is cut at the
prompt, the new wording (attachments kept) is sent with `editMessageId`, and the
server makes it a branch; the thread reloads afterwards for the pager.

## Methods

- `submit(text)`: needs text or an attachment, a model ("Pick a model first."
  through Dialogs) and no stream running. It is `takeStaged` then `sendStaged`,
  and empties the reply box.
- `takeStaged(text)`: takes what the composer has staged out of it and returns
  `{ text, attachments, context }` (the editor chips only with typed text).
- `sendStaged(staged)`: sends one staged message as a turn of the conversation on
  screen. It leaves the reply box alone, because
  [PendingMessages](../pending/PendingMessages.md) sends queued messages through it
  while the user may be typing the next one.
- `regenerate(target?)`: the clicked reply, else the last one; ignored while
  streaming.
- `resend(userMessage, text)`: ignored while streaming; needs a model.
- Both redraw the thread through [ConversationView](../conversation/ConversationView.md)`.rerender`, not
  `render`, so a chat mode's composer decoration survives the redraw.
- `showHostTurn(opening, requestId)`: a turn the host started in the conversation on
  screen (a background task's results, see [HostTurns](HostTurns.md)). The opening
  message (the app's notice) is pushed and rendered, and the reply's placeholder is
  started as for a send, under the host's request id.
- `trackHostTurn(conversationId, requestId)`: the same turn while its conversation is
  not on screen. Only the stream is tracked (`streaming`, `streamConvId`, the request
  remembered); opening the conversation shows it, as for any reply still streaming.
- `abort()`: `api.chatAbort()`.
- The live user turn carries `regions` (the marked areas with their previews)
  so [UserTurnView](../turns/UserTurnView.md) paints them at once.
- `recoverTurnImages(userMessage)`: `{ kind: 'image', name, mime, base64 }` from
  the bytes held since send, else from the turn's persisted image artifacts.

chat2 arguments: `requestId`, `conversationId` (undefined on the landing),
`modelRef`, `messages` ([TurnFlags](TurnFlags.md)`.context`), then
`userMessage`, `attachments` (images, each with `region` when one was marked,
then the region entries), `context` (send) or `attachments?`,
`regenerateMessageId` (regenerate) or `userMessage`, `attachments?`,
`editMessageId` (resend), then the [TurnFlags](TurnFlags.md). A
`success: false` reply or a throw finalizes the turn as an error.
