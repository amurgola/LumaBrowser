# RecordedCalls

`extensions/site-apis/builder/RecordedCalls.js`

Reads the page tool calls the builder model made since an endpoint was defined: the persisted tool trace of
earlier assistant messages merged with the running turn's live trace, so a demonstration compiles in the same
turn it was made.

## Where the trace comes from

- Live: a mode tool handler receives `ctx.trace`, the turn's `ToolTrace` (`BridgeRun._toolContext`,
  `ToolDispatch._runInjected`); `ctx.trace.entries` is `[{ tool, params, status: 'run' | 'ok' | 'err', error, summary, meta }]`
  in call order, this turn only.
- Persisted: `TurnFinisher._persistTrace` writes the same entries to `message.toolCalls = { tools, artifacts }`
  when the turn ends. Browser tools have no presenter and no summary, so only the params survive either way;
  selectors come from the params the model passed.

## Methods

- `collect(chatStore, conversationId, marker, { excludeMessageId, trace })`: `since(...)` for earlier messages
  plus `live(...)` for the running turn, in order.
- `live(trace, marker, messageId)`: the live entries with status `ok`, without the running `compile_endpoint`;
  when the marker points at this message (define_endpoint ran in this turn) only the entries after the last
  `define_endpoint` of that endpoint; otherwise everything, unless the turn holds a define for the endpoint
  anyway, in which case what follows it.
- `since(chatStore, conversationId, marker, { excludeMessageId })`: the persisted path. `marker` is
  `{ messageId, at, name }` from `define_endpoint`. Walks the active messages in order; in the marker message
  takes only the entries after the last `define_endpoint` of that name (an earlier endpoint's demonstration in
  the same reply is excluded); every later assistant message contributes all its entries; `excludeMessageId`
  (the running turn, whose trace is live, not stored) is skipped. When the marker message is gone
  (regenerated), falls back to `createdAt >= at`.
- `entriesOf(message)`: the trace entries whatever the stored shape (`{ tools }` or a bare array).

Each answered call is `{ tool, params, success, error, messageId }`.
