# SeleniumSettingsTab

`extensions/selenium-driver/ui/SeleniumSettingsTab.js`

The Selenium Driver settings tab in the main window: start and stop the
WebDriver server, its host, port, URL prefix and autostart, and the LLM
selector-fallback defaults. Changes save automatically.

## Methods

- `activate(context)`: tears down a previous activation, registers the
  `settings-tab` slot (`selenium-driver`, label `Selenium Driver`, refreshing
  on tab activation) through `context.slotManager`, binds the controls and
  refreshes the status over `context.ipcBridge`.
- `deactivate()`: drops the container, so later saves and refreshes do nothing.

Behaviour: Start and Stop disable themselves, show `Starting` / `Stopping`,
invoke the channel, restore the label and refresh. The status line reads
`WebDriver: running|stopped|unavailable`; when running, the endpoint line
shows `http://host:port<prefix>, N active session(s)` and only Stop is
enabled. Host, port and prefix save 500 ms after typing stops and at once on
change; the checkboxes save on change. Each save sends the full patch
`{ host (default 127.0.0.1), port (default 9515), prefix (default ''),
enabled, fallback: { defaultEnabled, onFindFail, onClickIntercepted } }` and
flashes the [SavedBadge](../../ui-kit/ui/SavedBadge.md) after the status text.
On fill, fallback defaults off and both retries default on.

## IPC

`ext.selenium-driver.status`, `ext.selenium-driver.start`,
`ext.selenium-driver.stop`, `ext.selenium-driver.settings.set(patch)` (see
[SeleniumDriverExtension](../SeleniumDriverExtension.md)).

## Globals

None. The entry `renderer.js` writes `window.__ext_selenium_driver`
(`{ activate, deactivate }`), the shell's extension renderer contract.
