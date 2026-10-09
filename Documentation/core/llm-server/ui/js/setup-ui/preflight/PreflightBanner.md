# PreflightBanner

`core/llm-server/ui/js/setup-ui/preflight/PreflightBanner.js`

The LLM tab's boot-time configuration banner. It shows the main process's
preflight issues ([Preflight](../../../../Preflight.md): a configured runtime
not installed, a vanished default model, missing Linux system libraries) and
live VRAM pressure from the watchdog, as a fixed `.preflight-banner` over both
Setup and Chat, each issue with a one-click fix. It re-checks whenever a runtime
installs or the model library changes. Loaded only by the LLM tab (the web
client has no preflight API).

Helpers: [PreflightIssues](PreflightIssues.md), [VramIssue](VramIssue.md),
[PreflightRow](PreflightRow.md), [PreflightInstall](PreflightInstall.md),
[PreflightProgress](PreflightProgress.md).

## Methods

- `new PreflightBanner({ api, doc?, win? })`, `api` = `window.llmDiagAPI`.
- `start()`: returns `false` and does nothing without `api.getPreflight`;
  otherwise binds the re-check signals and VRAM events, runs `check()` and
  seeds VRAM rows from `getVramPressure()`.
- `check()`: single-flight read of `getPreflight()`; a transient failure is
  ignored (a later signal retries).
- `scheduleCheck()`: coalesces bursts into one check after 300 ms.
- `onVramPressure(card)`: applies one watchdog card; fresh pressure reopens a
  banner the user closed for the session.

## Fixes

| `issue.fix.kind` | Button | Action |
|---|---|---|
| `install-runtime` | Download and install | `installRuntime(runtimeId)` on the `llm` / `image` / `music` surface, progress from that surface's `onRuntimeEvent`, then re-check. The row is kept untouched across re-renders while it installs. |
| `open-view` | Open Setup | dispatches `luma-switch-mode` with detail `'setup'`, then clicks `#pageNav button[data-view=image|music|settings]` |
| `sysdeps` | Check again (+ Copy) | re-check; Copy puts the `aptLine` on the clipboard |
| `dismiss-vram` | Dismiss | hides the card's row and calls `dismissVramPressure(card)` |

The head's close button hides the banner until the tab reloads. A banner of only
VRAM rows reads "GPU memory is running low", otherwise "Setup problems found".

## Globals

Reads `api` (`getPreflight`, `getVramPressure`, `dismissVramPressure`,
`onModelEvent`, `onRuntimeEvent`, `installRuntime`, `.image`, `.music`).
Listens on `window` `luma-models-changed`; dispatches `luma-switch-mode` on
`window`; appends to `document.body`.
