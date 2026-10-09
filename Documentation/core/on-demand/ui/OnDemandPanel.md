# OnDemandPanel

`core/on-demand/ui/OnDemandPanel.js` (started by `core/on-demand/ui/entry.js`)

The panel controller: state from main, the chat turn, the composer, drag and keys.

## Methods

- `new OnDemandPanel(win, doc)`; `start()`: creates the voice (when the API has
  one), subscribes to chat events and state, wires drag (tile: click opens;
  header: drag only), Escape/Close (collapse), the composer, shows the empty
  log, sends `ready` and applies `getState()`.
- `submit(text)`: needs a model; interrupts a running turn (abort, wait up to
  80 x 100 ms); adds the "You" bubble and a [ReplyStream](ReplyStream.md); sends
  `{ requestId, text, spoken }` (`spoken` when the speaker, TTS and voice are on);
  a `success: false` reply ends the turn with its error.
- `handleChatEvent(evt)`: only this request's events: `delta`, `rollback`,
  `tool` (run/done steps), `done` (aborted), `error`.
- `finishTurn({ error, aborted })`, `applyState(st)`, `loadHistory()`.

`applyState`: header (title or host, URL tooltip, model or "No model set up"),
tile dot (`ready`/`bad`), `tile-live`, expanded/collapsed. A tab change (unless
it shares the conversation, as a tab the page opened does) drops the running
turn and clears the log. Opening loads history, focuses the input and starts
the mic when auto-voice is on.
