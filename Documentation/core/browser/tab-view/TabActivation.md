# TabActivation

`core/browser/tab-view/TabActivation.js`

Makes a tab the visible, focused one in its window, and walks a window's strip for tab cycling.

## Methods

- `new TabActivation({ hosts, registry, channel, layout, emitter })`.
- `switchTo(tabId)` -> `{ success }`; refuses unknown and silent tabs. Steps: a
  hidden persisted tab is un-hidden (unmuted, normal priority) and broadcast first
  so the renderer rebuilds its strip element; the window's previous view is hidden; the new
  view is shown (stamping its `lastActivatedAt`), raised in its window (removed and re-added so
  it paints last), laid out and given keyboard focus; then `windowTabSwitched(windowId, id)`
  is emitted (plus `tabSwitched(id)` for the main window), `tab:switched` sent to the
  tab's window and the state broadcast.
- `cycle(delta, hostId = 0)`: the window's strip tab `delta` places from its active one, wrapping.
- `selectByIndex(n, hostId = 0)`: the window's nth strip tab, 1-based; `n <= 0` is the last one.
