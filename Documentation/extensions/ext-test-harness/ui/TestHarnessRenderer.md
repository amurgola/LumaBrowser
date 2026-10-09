# TestHarnessRenderer

`extensions/ext-test-harness/ui/TestHarnessRenderer.js`

The Test Harness UI in the main window: the bottom-bar panel (discovered tests
with Run buttons, run history with expandable detail and Copy as MD) and the
settings tab (runner model, clear history). The shell registers the manifest's
`panel.html` (bottom bar) and `settings.html` before `activate()`.

## Methods

- `activate(context)`: takes `context.ipcBridge` and
  `context.containers.panelContainer` / `settingsContainer`, wires the bottom
  bar and settings, sets the settings tab's `onActivate` (through
  `context.slotManager.setCallback`) to repopulate the
  [RunnerModelPicker](RunnerModelPicker.md), loads tests and runs, and polls
  `getTestRuns` every 3 s while any run is `running`. A second activate first
  deactivates.
- `deactivate()`: stops polling and drops the containers and lists.

Behaviour: the bar summary toggles the expanded area (`ext-hidden`) and the
caret's `expanded` class, reloading on expand; the Refresh button reloads
without toggling. The count reads `N test(s)`, the status `N running...`.
Run shows `Starting...`, then `Running...` and reloads runs; a refusal or throw
alerts `Failed to start test: <error>` / `Failed to start test.` (via
Dialogs); the label resets after 2 s. A run row click opens its detail
(`getTestRunDetail`), a second click closes it; clicks inside the detail are
ignored. Copy as MD shows `...`, then `Copied!`, `No data` or `Error` for
1.5 s; it copies through `window.electronAPI.copyToClipboard` when present,
else `Clipboard.copyText`. Both Clear buttons confirm
`Delete all test run history?` before `clearAllRuns`.

## IPC

`ext.ext-test-harness.discoverTests`, `getTestRuns(20, 0)`,
`runTest(testId, variantId?)`, `getTestRunDetail(runId)`, `clearAllRuns`
(see [TestHarnessIpcHandlers](../TestHarnessIpcHandlers.md)).

## Globals

Reads `window.electronAPI.copyToClipboard`, `window.LumaModal` (through
Dialogs) and `window.llmSlotAPI` (through RunnerModelPicker). The entry
`renderer.js` writes `window.__ext_ext_test_harness` (`{ activate, deactivate }`).
