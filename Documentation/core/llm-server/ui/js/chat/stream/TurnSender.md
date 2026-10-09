# TurnSender

`core/llm-server/ui/js/chat/stream/TurnSender.js`

Starts turns. A send takes the composer text plus staged attachments and (with
typed text) the editor chips, renders the user turn (from the landing it becomes
the conversation, titled after the text or the first image), opens the live turn
and calls `api.chat2`. A regenerate replaces a reply in place as a new variant:
no user message is re-sent, later turns are dropped from the context, and the
user turn's images are re-forwarded so a rerun keeps vision. A resend (edit and
resend a prompt) is the same shape on the user side: the thread is cut at the
prompt, the new wording (attachments kept) is sent with `editMessageId`, and the
server makes it a branch; the thread reloads afterwards for the pager.

## Methods

- `submit(text)`: needs text or an attachment, a model ("Pick a model first."
  through Dialogs) and no stream running.
- `regenerate(target?)`: the clicked reply, else the last one; ignored while
  streaming.
- `resend(userMessage, text)`: ignored while streaming; needs a model.
- `abort()`: `api.chatAbort()`.
- `recoverTurnImages(userMessage)`: `{ kind: 'image', name, mime, base64 }` from
  the bytes held since send, else from the turn's persisted image artifacts.

chat2 arguments: `requestId`, `conversationId` (undefined on the landing),
`modelRef`, `messages` ([TurnFlags](TurnFlags.md)`.context`), then
`userMessage`, `attachments`, `context` (send) or `attachments?`,
`regenerateMessageId` (regenerate) or `userMessage`, `attachments?`,
`editMessageId` (resend), then the [TurnFlags](TurnFlags.md). A
`success: false` reply or a throw finalizes the turn as an error.
