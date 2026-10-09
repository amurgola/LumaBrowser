# NetworkWatcherTab

`extensions/network-watcher/ui/NetworkWatcherTab.js`

The Network Watcher settings tab in the main window: add, test, pause,
resume and delete watchers and see when each last fired.

## Methods

- `activate(context)`: deactivates first if already active, registers the
  `settings-tab` slot (`network-watcher`, label `Network Watcher`, tab id
  `watchers`, `loadWatchers` on tab activation) through `context.slotManager`
  with [NetworkWatcherMarkup](NetworkWatcherMarkup.md), builds
  [WatcherForm](WatcherForm.md) and [WatcherListView](WatcherListView.md), and
  binds Add and Send a test. Logs `network-watcher: failed to register settings
  tab` when no container comes back.
- `deactivate()`: clears the test-result timer, closes any open
  [OverflowMenu](../../ui-kit/ui/OverflowMenu.md), drops the container and list.
- `loadWatchers()`: `getAll`, renders the list, then `getStats` into the stat
  row. Does nothing after deactivate; errors are logged.
- `handleAdd()`: requires a URL pattern (`Enter a URL pattern to watch.`) and a
  target (`Enter the webhook URL to send captures to.`), sends `add(form)`; on
  success clears the form, reloads and flashes an `Added` badge
  ([SavedBadge](../../ui-kit/ui/SavedBadge.md)), else
  `Could not add the watcher: <error>`.
- `handleTest()`: same checks (`... to test.`), shows `Sending` on the disabled
  button, sends `test(form)` and shows `Test payload delivered. Check your
  webhook endpoint.` or `Test failed: <error>`.
- `handleToggle(id, enabled)`: `toggle(id, enabled)`, reloads on success.
- `handleDelete(id)`: `Dialogs.confirm('Delete the watcher for "<pattern>"?',
  { okLabel: 'Delete', danger: true })`, then `remove(id)` and reload.

## IPC

`ext.network-watcher.getAll`, `getStats`, `add(data)`, `test(data)`,
`toggle(id, enabled)`, `remove(id)` (see
[NetworkWatcherExtension](../NetworkWatcherExtension.md)).

## Globals

Reads `window.LumaModal` (through Dialogs). The entry `renderer.js` writes
`window.__ext_network_watcher` (`{ activate, deactivate }`), the shell's
extension renderer contract.
