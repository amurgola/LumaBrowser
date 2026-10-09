# WatcherListView

`extensions/network-watcher/ui/WatcherListView.js`

The Network Watcher list of watcher cards.

## Methods

- `new WatcherListView(listEl, { onToggle(id, enabled), onDelete(id) })`.
- `render(watchers)`: one `.watcher-item` card per watcher: status dot
  (`Active` / `Paused`), pattern, a `Paused` badge, optional note, method
  (`Any method` for `*`), `to <target>`, and `N capture(s), last <relative
  time>` or `No captures yet`; a `.nw-toggle` switch and a `.nw-delete`
  button wired to the handlers. Every value is escaped. No watchers: the
  "No watchers yet" empty state.
