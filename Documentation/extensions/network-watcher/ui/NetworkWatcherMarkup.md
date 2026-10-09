# NetworkWatcherMarkup

`extensions/network-watcher/ui/NetworkWatcherMarkup.js`

The Network Watcher settings tab markup.

## Members

- `NetworkWatcherMarkup.SETTINGS_HTML`: the stat row (`#ext-nw-totalWatchers`,
  `#ext-nw-enabledWatchers`, `#ext-nw-totalTriggers`), the "Add a watcher" form
  (`#ext-nw-urlPattern`, `#ext-nw-sendTo`, `#ext-nw-note`, `#ext-nw-method`,
  `#ext-nw-captureHeaders`, `#ext-nw-captureBody`, `#ext-nw-formErr`,
  `#ext-nw-addBtn`, `#ext-nw-testBtn`, `#ext-nw-testResult`), the list
  (`#ext-nw-watcherList`) and two `<details>` blocks documenting the forwarded
  payload and `GET /api/watchers/{watcherId}/last-response`.
