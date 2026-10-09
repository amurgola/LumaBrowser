# TabLifecycle

`core/browser/tab-view/TabLifecycle.js`

Creates, closes, hides, reorders and destroys tabs.

## Methods

- `new TabLifecycle({ mainWindow, db, registry, channel, factory, activation, persisted, wireEvents, emitter })`.
- `create(url = DEFAULT_START_PAGE, options)`: builds the [TabEntry](TabEntry.md)
  and view, registers it at `options.index`, attaches the view, wires its events,
  attaches services, emits `viewAttached` then `tabCreated`, applies the identity
  override, starts loading the [TabUrl](../TabUrl.md)-normalized URL, then
  activates it (default) or broadcasts it. Returns the serialized tab.
- `close(tabId)`: pinned tabs refuse. Closing the last regular strip tab first
  opens a start-page tab (`startPageUrl` setting, default duckduckgo) right after
  it. Regular browsing tabs with a URL go to `recentlyClosed` (newest last, 25 max).
  Persisted tabs are hidden, others destroyed.
- `reopenClosed()`, `move(tabId, toIndex)` (emits `tabMoved`, sends `tab:moved` with the order).
- `hide(tabId)`: marks hidden, denies pending permission prompts, mutes and
  deprioritizes, hides the view, hands activity to the neighbour, emits `tabHidden`.
- `destroy(tabId)`: answers open permission prompts, removes and closes the view,
  unregisters (a persisted tab also leaves the stored list), hands activity to the
  neighbour, emits `tabClosed`. Bypasses pinned and last-tab rules.
- `destroyAll()`: closes every view and clears the registry.
- `recentlyClosed`: `[{ url, title }]`.

## Why

Closing must never leave the user facing an empty strip, or only the pinned LLM
tab, with a close button that silently does nothing. The neighbour of a closing
active tab is resolved before the tab leaves the strip.
