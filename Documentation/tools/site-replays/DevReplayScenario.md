# DevReplayScenario

`tools/site-replays/DevReplayScenario.js`

The one development task the lumabyte.com homepage replays on its "Terminal CLI" and "IDE plugins" tabs: a failing
cart discount test, investigated, fixed with one approved edit and re-run. [SiteReplayBuilder](SiteReplayBuilder.md)
plays it into the real CLI session ([CliSessionRecorder](CliSessionRecorder.md)) and ships it as JSON for the real
IDE page, so both surfaces show the same task. Copy rule: no em-dashes in visitor-facing text.

## Methods

- `DevReplayScenario.timeline()`: `[waitMsBefore, type, payload]` entries built with [ReplayTimeline](ReplayTimeline.md).
  Two entries are player cues, not bridge frames: `@approve` (the person approves the pending edit; the CLI presses
  `y`, the IDE clicks Approve; `approval-done` follows) and `@edited` (the file changed; the IDE tab updates its editor).
- Constants: `PROMPT`, `AGENT`, `MODEL`, `ROOT_LABEL`, `SUGGESTION`, `CART_JS` (the editor file before the fix),
  `OLD_LINE`, `NEW_LINE`, `FAIL_OUT`, `PASS_OUT`, `REASONING`, `EXPLANATION`, `ANSWER`.
