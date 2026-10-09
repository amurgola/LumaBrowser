# StreamFinisher

`core/llm-server/ui/js/chat/stream/StreamFinisher.js`

Ends the in-flight turn: re-renders it statically (a reasoning pane still open
animates shut; the last words and images keep fading via `StreamView.settle`), closes the sink, clears the panel's building badge and a stale
live tab, restores Send, refreshes the sidebar, and, keyed on the conversation
the stream belonged to, reloads a regenerated thread for its variant pager and
asks for an AI title after a first exchange.

## Methods

- `done(aborted)`: an abort before any text marks the turn "stopped"; voice is
  told afterwards (an abort skips its speech drain).
- `error(message, meta?)`: `meta.code` hints (such as `RUNTIME_NOT_INSTALLED`)
  are kept for the fix card.
