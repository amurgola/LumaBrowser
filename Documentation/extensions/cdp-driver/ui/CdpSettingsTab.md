# CdpSettingsTab

`extensions/cdp-driver/ui/CdpSettingsTab.js`

The CDP Driver settings tab in the main window: start and stop the CDP
WebSocket server, its host, port and autostart, and the LLM selector-fallback
defaults. Changes save automatically.

## Methods

- `activate(context)`: tears down a previous activation, registers the
  `settings-tab` slot (`cdp-driver`, label `CDP Driver`, refreshing on tab
  activation) through `context.slotManager`, binds the controls and refreshes
  the status over `context.ipcBridge`.
- `deactivate()`: drops the container, so later saves and refreshes do nothing.

Behaviour: Start and Stop disable themselves, show `Starting` / `Stopping`,
invoke the channel, restore the label and refresh. The status line reads
`CDP server: running|stopped|unavailable`; when running, the endpoint line
shows `http://host:port, N session(s), N target(s)` and only Stop is enabled.
Host and port save 500 ms after typing stops and at once on change; the
checkboxes save on change. Each save sends the full patch
`{ host (default 127.0.0.1), port (default 9222), enabled, fallback:
{ defaultEnabled, onFindFail, onClickIntercepted } }` and flashes the
[SavedBadge](../../ui-kit/ui/SavedBadge.md) after the status text. On fill,
fallback defaults off and both retries default on.

## IPC

`ext.cdp-driver.status`, `ext.cdp-driver.start`, `ext.cdp-driver.stop`,
`ext.cdp-driver.settings.set(patch)` (see [CdpDriverExtension](../CdpDriverExtension.md)).

## Globals

None. The entry `renderer.js` writes `window.__ext_cdp_driver`
(`{ activate, deactivate }`), the shell's extension renderer contract.
