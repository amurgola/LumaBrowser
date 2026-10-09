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
- `newRequestId()`: sets and returns `reqId` (`req-<ms>-<rand>`).
- `resetChatOptions(toolsOn)`: tools flag, empty denylist, replies on, no
  thinking override, documentation source off (`docsSource`, the
  "@lumabrowser-documentation" pill, see [DocsSourceContext](composer/DocsSourceContext.md)).
- `enterPlainChat()`: mode `'chat'`, no mode descriptor or meta.
