# IdeWebviewDemo

`tools/site-replays/IdeWebviewDemo.js`

Base class for the IDE page demos: renders the shared tool-window page (`ide/webview`) outside its IDE in Playwright's
Edge (`channel: 'msedge'`, headless, 420x760), drives it through [IdeDemoTurn](IdeDemoTurn.md) and writes
`1-offline.png`, `2-ready.png`, `3-approval.png`, `4-done.png`, `5-done-top.png`, `page.html` and `sent.json` (the
messages the page sent its host). The turn: offline state, ready state with a context chip, the prompt typed and sent
with Enter, the frames replayed with `y` pressed at the approval, the end state. Page errors and console errors and
warnings are collected in `problems` and printed. Implementations: [JetBrainsWebviewDemo](JetBrainsWebviewDemo.md),
[VscodeWebviewDemo](VscodeWebviewDemo.md).

## Methods

- `new IdeWebviewDemo(root, defaultOut, { log, error })`.
- `execute(args)`: `--light`, `--out dir`; resolves 0 when `verify` found nothing (prints `ok`), else 1 (each failure
  printed as `FAIL:`).
- `configure(args)` (sets `light`, `outDir`), `pageState(over)`.
- Subclass hooks: `verify({ sent, probe })` (abstract, returns failure messages), `_openPage(page)`,
  `_dispatch(page, msg)`, `_sentMessages(page)` (abstract); `_applyTheme`, `_probe`, `_closeHost` (optional).
- `IdeWebviewDemo.missingMessages(sent)`: the shared check (`ready`, `prompt`, `approve`).
