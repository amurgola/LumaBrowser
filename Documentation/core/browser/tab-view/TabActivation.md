# TabActivation

`core/browser/tab-view/TabActivation.js`

Makes a tab the visible, focused one, and walks the strip for tab cycling.

## Methods

- `new TabActivation({ mainWindow, registry, channel, layout, emitter })`.
- `switchTo(tabId)` -> `{ success }`; refuses unknown and silent tabs. Steps: a
  hidden persisted tab is un-hidden (unmuted, normal priority) and broadcast first
  so the renderer rebuilds its strip element; the previous view is hidden; the new
  view is shown (stamping its `lastActivatedAt`), raised (removed and re-added so
  it paints last), laid out and given keyboard focus; then `tabSwitched` is emitted, `tab:switched` sent and the
  state broadcast.
- `cycle(delta)`: the strip tab `delta` places from the active one, wrapping.
- `selectByIndex(n)`: the nth strip tab, 1-based; `n <= 0` is the last one.
