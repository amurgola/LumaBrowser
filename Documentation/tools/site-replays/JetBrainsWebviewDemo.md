# JetBrainsWebviewDemo

`tools/site-replays/JetBrainsWebviewDemo.js`

An [IdeWebviewDemo](IdeWebviewDemo.md) that loads the page the way `LumaWebView.kt` does: inlined into one string by
[IdePageInliner](IdePageInliner.md) and set with `page.setContent`, `window.__luma.dispatch` in, `window.__lumaSend`
out (bridged to a Playwright-exposed `__lumaSendNative`). The IDE theme arrives as a `theme` message (`THEME_DARK`,
`THEME_LIGHT`). A cheap check of the page before a full `gradlew runIde`.
Thin entry: `scripts/jetbrains-webview-demo.js [--light] [--out dir]` (default `tmp/jetbrains-webview`).

## Methods

- `new JetBrainsWebviewDemo(root, { log, error })`; `execute(args)` (from the base).
- `verify({ sent })`: the shared message check, plus the prompt must carry the one context chip.
