# Terminal

`cli/lib/tui/Terminal.js`

Owns the real terminal for the full-screen session. An `EventEmitter`: `key`, `resize`, `osc`.

## Methods

- `new Terminal({ input = process.stdin, output = process.stdout })`.
- `start()`: raw mode, UTF-8, listen, bracketed paste on. `stop()`: paste off, cursor shown, styles
  reset, raw mode off, input paused.
- `feed(chunk)`: parses through [KeyParser](KeyParser.md); an unfinished sequence waits
  `ESC_TIMEOUT_MS` (40) and then becomes `escape` (a lone ESC) or alt+chars.
- `dispatch(k)`: `osc` replies go to the `osc` event, focus events are dropped, the rest are `key`.
- `queryBackground(timeoutMs = 200)`: asks OSC 11; resolves the raw reply or `null`.
- `write(s)`; getters `columns`, `rows`, `isTTY`.
