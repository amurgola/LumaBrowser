# IdeDemoTurn

`tools/site-replays/IdeDemoTurn.js`

One plausible turn (an off-by-one in a range helper, fixed with one approved edit) as bridge frames, for the IDE page
demos ([JetBrainsWebviewDemo](JetBrainsWebviewDemo.md), [VscodeWebviewDemo](VscodeWebviewDemo.md)). Both hosts render
`ide/webview`, so both replay exactly this.

## Methods

- `IdeDemoTurn.state(over)`: the page state a host pushes (`ready`, agent Reviewer, `ideName` WebStorm) with overrides.
- Constants: `TURN` (`[type, payload]` frames in order), `PROMPT`, `CONTEXT` (the selection chip the prompt carries).
