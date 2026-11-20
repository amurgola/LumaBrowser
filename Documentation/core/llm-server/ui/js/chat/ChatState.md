# ChatState

`core/llm-server/ui/js/chat/ChatState.js`

Everything one chat surface remembers between renders: models and the
selection, conversations and the open one, the in-flight stream, the composer's
per-chat options, staged attachments and editor context, the open panel, the
active extension mode, and the session caches of server timings and final tab
frames by message id.

## Methods

- `streamOnScreen()`: the stream's conversation is the one displayed (the live
  message object is in `messages`). Legacy `streamConvActive`.
- `isNewestMessage(m)`.
- `newRequestId(given?)`: sets and returns `reqId` (`req-<ms>-<rand>`), or `given`, the
  id of a turn the host started and this surface follows
  ([HostTurns](stream/HostTurns.md)).
- `rememberRequest(requestId, conversationId)`, `conversationOfRequest(requestId)`: which conversation a turn ran
  in, for the newest `REQUESTS_REMEMBERED` (16) requests sent from this surface (`requestConversations`). A mode's
  reaction sends events after its turn's stream has ended and after a newer turn has taken `reqId`;
  [ChatEventRouter](stream/ChatEventRouter.md) matches them through this. `null` for an unknown request.
- `resetChatOptions(toolsOn)`: tools flag, empty denylist, replies on, no
  thinking override, documentation source off (`docsSource`, the
  "@lumabrowser-documentation" pill, see [DocsSourceContext](composer/DocsSourceContext.md)),
  and no say on the media models (`mediaModels` null: this chat's image, edit
  and video model, `{ image?, edit?, video? }` once picked or restored, see
  [MediaModelChoice](composer/MediaModelChoice.md)).
- `enterPlainChat()`: mode `'chat'`, no mode descriptor or meta.
