# TabTransfer

`core/browser/tab-view/TabTransfer.js`

Moves tabs between windows. A moved tab keeps its page, history and session; only
the window drawing its view changes.

## Methods

- `new TabTransfer({ hosts, registry, channel, factory, activation, lifecycle, emitter })`.
- `move(tabId, toHostId, { index, activate = true })` -> `{ success, windowId }` or
  `{ success: false, error }` (unknown tab or window, or a tab that is not
  [movable](TabEntry.md)). The window the tab leaves hands its active slot to the
  neighbour and gets `tab:transferred { id, windowId }` (not `tab:closed`, so its
  renderer does not offer to reopen it); the view is re-parented
  ([TabViewFactory](TabViewFactory.md) `reparent`); `index` places it in the full
  order (`tab:moved` to the new window); the new window gets its state before the
  switch so its strip builds the element first. Emits `tabTransferred(id, from, to)`
  and, when the old window is a detached one now empty, `windowEmptied`. A move to
  the tab's own window only reorders and activates.
- `evacuate(hostId)`: a detached window is closing. Persisted tabs are hidden (and
  go back to the main window); the rest are remembered for reopen-closed and
  destroyed; the host is forgotten. False for the main window or an unknown one.
- `resync(hostId)`: re-broadcasts the window's tabs and its active tab, for a chrome
  renderer that reloaded and lost its mirror; returns how many.
