# PageMonitorsRenderer

`extensions/page-change-detector/ui/PageMonitorsRenderer.js`

The Page Monitors renderer in the main window. It wires the right-dock panel
(`panel.html`) and the settings page (`settings.html`) that the shell mounts
from the manifest, loads monitors over IPC, and keeps both live from the
`changed` event.

## Methods

- `activate(context)`: deactivates first when already active; registers the
  settings tab's `onActivate` (refreshes the settings page) through
  `context.slotManager.setCallback`; builds [MonitorForm](MonitorForm.md),
  [MonitorRowActions](MonitorRowActions.md) and
  [MonitorListView](MonitorListView.md) over `context.containers.panelContainer`
  and [MonitorHistoryPage](MonitorHistoryPage.md) over
  `context.containers.settingsContainer` (each only when its container
  exists); loads monitors; subscribes to `ext.page-change-detector.changed`
  and starts the 30 s tick that refreshes relative times.
- `deactivate()`: stops the timers, unsubscribes, closes any open
  OverflowMenu and drops the views. The settings history view (monitor, page,
  mode) is kept for the next activation, as legacy did.
- `loadMonitors()`: `getAll`, then renders the rows and syncs the settings
  selector. No-op when inactive; a failure is logged as
  `page-change-detector: load failed:`.

Change events are debounced 150 ms into one reload; a `check-finished` event
also reloads the inline history or settings history showing that monitor.
"Full history" opens Settings (`#settingsModal` gets `active`, then
`uiSlotManager.switchSettingsTab('extensions')` and
`_showExtensionConfig('page-change-detector')`) on that monitor. "Open Page
Monitors panel" closes Settings and clicks the toolbar button
(`.toolbar-btn[data-extension-id="page-change-detector"]`) unless the panel is
already showing. A row's URL opens with `window.tabAPI.create`, else
`window.electronAPI.openExternal`.

## IPC

`ext.page-change-detector.getAll`, `create`, `update`, `delete`, `checkNow`,
`pickElements`, `clearSelectors`, `getHistory(id, 10)`,
`getHistoryPaged(id, { page, pageSize, changedOnly })`; event
`ext.page-change-detector.changed` (`{ monitorId, reason }`, see
[MonitorBroadcast](../MonitorBroadcast.md)).

## Globals

Reads `window.uiSlotManager`, `window.tabAPI`, `window.electronAPI`,
`window.LumaModal` (through Dialogs), `document`. The entry `renderer.js`
writes `window.__ext_page_change_detector` (`{ activate, deactivate }`), the
shell's extension renderer contract.
