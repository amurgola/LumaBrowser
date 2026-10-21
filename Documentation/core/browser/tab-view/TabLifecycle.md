# TabLifecycle

`core/browser/tab-view/TabLifecycle.js`

Creates, closes, hides, reorders and destroys tabs, in whichever window they live.

## Methods

- `new TabLifecycle({ hosts, db, registry, channel, factory, activation, persisted, wireEvents, emitter })`.
- `create(url = DEFAULT_START_PAGE, options)`: builds the [TabEntry](TabEntry.md)
  and view, registers it at `options.index`, attaches the view, wires its events,
  attaches services, emits `viewAttached` then `tabCreated`, applies the identity
  override, starts loading the [TabUrl](../TabUrl.md)-normalized URL, then
  activates it (default) or broadcasts it. Returns the serialized tab. The window is
  `options.windowId` when known, else the opener's (`openerTabId`), else the main one;
  silent, hidden, pinned, internal and automation tabs always go to the main window.
- `close(tabId)`: pinned tabs refuse. Closing the main window's last regular strip tab first
  opens a start-page tab (`startPageUrl` setting, default duckduckgo) right after
  it. Regular browsing tabs with a URL go to `recentlyClosed` (newest last, 25 max).
  Persisted tabs are hidden, others destroyed.
- `reopenClosed(hostId = 0)`, `move(tabId, toIndex)` (emits `tabMoved`, sends `tab:moved`
  with the order to the tab's window).
- `hide(tabId)`: marks hidden, denies pending permission prompts, mutes and
  deprioritizes, hides the view, hands activity to the neighbour, emits `tabHidden`.
  A tab hidden in a detached window moves back to the main window, where the
  persisted-tabs menu can bring it back.
- `destroy(tabId)`: answers open permission prompts, removes and closes the view,
  unregisters (a persisted tab also leaves the stored list), hands activity to the
  neighbour, emits `tabClosed`. Bypasses pinned and last-tab rules.
- `reportIfEmptied(hostId)`: emits `windowEmptied(hostId)` when a detached window has
  no strip tab left (closed, hidden or moved away); never for the main window.
- `remember(entry)`: records a tab for `reopenClosed` (a closing window's tabs).
- `destroyAll()`: closes every view and clears the registry.
- `recentlyClosed`: `[{ url, title }]`.

## Why

Closing must never leave the user facing an empty strip, or only the pinned LLM
tab, with a close button that silently does nothing. The neighbour of a closing
active tab is resolved before the tab leaves the strip.

## First navigation waits for Chrome extension loads

`create` starts the page load through `_startLoading`. When
`TabViewFactory.extensionsSettling(entry)` returns a promise, the `loadURL`
waits for it, because Electron never finishes a navigation that overlaps a
Chrome extension load in the same session. After the wait it loads only if the
tab is still blank (not destroyed, not loading, no URL), so a navigation made
meanwhile wins. With no extensions loading the load starts synchronously, as
before.

The hold is journaled as `tab:load-held` / `tab:load-released { go }`. It does
not close every window: the LLM tab once stalled on a load released right as
the extension load resolved, so internal tabs also have
`InternalTabLoader`'s stall watchdog.
