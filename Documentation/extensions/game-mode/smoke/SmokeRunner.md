# SmokeRunner

`extensions/game-mode/smoke/SmokeRunner.js`

Boots a game for 3-30 s in a hidden offscreen BrowserWindow (offscreen so rAF keeps ticking; context isolation off so the preload collector patches the page world; Node off), captures a boot frame, one ~0.8 s after each action and a final frame, then reads the in-page report. Always resolves; one run at a time; `{ available: false }` outside an Electron main process.

## Methods

- `SmokeRunner.run({ gameDir, seconds, actions, url, screenshots, shotDir, BrowserWindow?, sleep? })` -> `{ available, loaded, report, consoleErrors, consoleLines, shots, texts, actions, seconds, url }` or a `busy` / `flattenError` / `loadError` result. `url` loads the live play page instead of the flattened copy.
- `clampSeconds(n)`, `resolveBrowserWindow()`.
- `texts` is `[{ label, at, texts: [string] }]`: at every captured mark (with or without screenshots) the runner reads `window.__lumaSmokeTexts()` from the collector (`_readTexts`, bounded by `REPORT_TIMEOUT_MS`); a page without the collector, a wedged or throwing page, or an answer that is not a JSON list reads as `[]`. [PlayabilityNotes](PlayabilityNotes.md) turns it into the on-screen text timeline and the progress check.

## Testing

Real rendering is e2e.
