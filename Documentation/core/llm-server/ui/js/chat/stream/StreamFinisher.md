# StreamFinisher

`core/llm-server/ui/js/chat/stream/StreamFinisher.js`

Ends the in-flight turn: re-renders it statically (a reasoning pane still open
animates shut; the last words and images keep fading via `StreamView.settle`), closes the sink, clears the panel's building badge and a stale
live tab, restores Send, refreshes the sidebar, and, keyed on the conversation
the stream belonged to, reloads a regenerated thread for its variant pager and
asks for an AI title after a first exchange. Last of all it tells
[PendingMessages](../pending/PendingMessages.md)`.onTurnEnd(conversationId, finished)`,
so the next queued message can go out (`finished` is false for a stopped or failed
reply, which holds the queue). The plan panel is repainted on the way, since its Clear
button depends on whether a reply is being written.

## Methods

- `done(aborted)`: an abort before any text marks the turn "stopped"; voice is
  told afterwards (an abort skips its speech drain).
- `error(message, meta?)`: `meta.code` hints (such as `RUNTIME_NOT_INSTALLED`,
  or `AGENT_TIMEOUT` with `meta.setting`) are kept as `errorMeta` for the fix
  card and the error card's "Edit setting" button.
