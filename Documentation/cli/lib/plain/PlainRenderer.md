# PlainRenderer

`cli/lib/plain/PlainRenderer.js`

Paints the bridge's frames onto a stream that is not an interactive terminal.

## Methods

- `new PlainRenderer({ mode, out?, err?, color?, showReasoning? })`: `mode` is `interactive`
  (answer and cards on `out`), `print` (answer on `out`, everything else on `err`) or `json`;
  `color` defaults to `out.isTTY`.
- `frame(type, payload)`: paints one frame; returns `'done'` or `'error'` for the frames that end a
  turn, else `null`. `json` writes `{ type, payload }` per line, verbatim.
- `turnStart()`, `c(code, text)` (colour when enabled), `side(text)`; field `mode`.

## Painting

`status` shows `… <phase text>` (statuses from [ToolGrammar](../tui/ToolGrammar.md)`.STATUS_TEXT`);
`delta` streams through a [RollbackBuffer](../RollbackBuffer.md); `reasoning-delta` streams dimmed with
`--show-reasoning`, else a TTY shows `… thinking (N chars)`; tool `run` is `▸ <tool> <detail>`, `done`
is `✓`/`✗` with the summary (160 chars), `approval` and `approval-done` get a line, `cancel` nothing;
`command:output` is indented; `artifact`, `queued`, `followup-start`, `busy` and `bridge-error` get a
line; `done` ends the answer line and prints `▣ <stopped · N steps · N tokens · Ns>` (or `▣ done`);
`error` prints `error: <message>`.
