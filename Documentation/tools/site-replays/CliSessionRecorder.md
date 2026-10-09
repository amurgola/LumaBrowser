# CliSessionRecorder

`tools/site-replays/CliSessionRecorder.js`

Records the real `luma` full-screen session ([App](../../cli/lib/tui/session/App.md) with a
[Terminal](../../cli/lib/tui/Terminal.md) on fake streams and `Theme.create` at truecolor dark) driven by a
[ScenarioLink](ScenarioLink.md): every byte it writes, timestamped. It first writes the shell line that starts the
session (`<ROOT_LABEL> $ luma <agent>`, typed at 70 ms a key), types the prompt at 34 ms a key, presses `y` at the
approval cue, waits 600 ms after the turn for the suggestion and the last paint, then marks the app closed so it
paints no goodbye. Callers set `LUMA_CLI_THEME` (the session then skips its OSC 11 query) and, for the `~` header,
`os.homedir`; [SiteReplayBuilder](SiteReplayBuilder.md) does both.

## Methods

- `new CliSessionRecorder({ scenario, cwd })`: `scenario` is `{ PROMPT, AGENT, MODEL, ROOT_LABEL, timeline() }`.
- `record({ cols, rows })`: resolves `{ cols, rows, duration, events: [[ms, bytes]] }`.
- `CliSessionRecorder.mergeEvents(events, windowMs = MERGE_MS)`: joins writes that land within 24 ms of the previous
  entry (same picture, a third of the entries).
