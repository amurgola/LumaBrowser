# SiteReplayBuilder

`tools/site-replays/SiteReplayBuilder.js`

Generates the data behind the lumabyte.com homepage's "Terminal CLI" and "IDE plugins" replay tabs. Nothing on those
tabs is a mock-up: the terminal tab plays back the bytes the real `luma` session wrote while driven through
[DevReplayScenario](DevReplayScenario.md) ([CliSessionRecorder](CliSessionRecorder.md), wide 104x30 and narrow 56x34,
recorded in parallel, about 23 s), and the IDE tab runs the real tool-window page ([IdePageInliner](IdePageInliner.md),
with a bridge that hands what the page sends to the site's mock IDE through `window.__lumaHost`) against the same
frames. Thin entry: `scripts/build-site-dev-replays.js` (`npm run build:site-replays`).

Output files: `cli-wide.json`, `cli-narrow.json` (`{ cols, rows, duration, events: [[ms, bytes]] }`), `ide-page.html`,
`ide-turn.json` (prompt, suggestion, page state, editor file, timeline).

## Methods

- `new SiteReplayBuilder(root, { log, error, recorder })`: `recorder(size)` is a test seam.
- `execute(args)`: `--out <dir>` (default `tmp/site-dev-replays/dev`), `--site <LumaByte repo>/www/demo` (copies the
  output into `<site>/dev`, plus `demo-replay.js` when one sits beside the output folder). Resolves the exit code
  (1 when the `--site` folder does not exist).
- `SiteReplayBuilder.pinEnvironment()`: `LUMA_CLI_THEME=dark` and `os.homedir()` = `/home/dev`, so the header shows
  `~/projects/storefront`.
- `SiteReplayBuilder.ideTurn()`.
