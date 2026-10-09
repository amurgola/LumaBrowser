# BrowserDataIpcHandlers

`core/browser-data/BrowserDataIpcHandlers.js`

IPC controller for history, bookmarks, start page, search engine, favicons and
dark mode. It only routes; the logic lives in the services it calls.

## Methods

- `new BrowserDataIpcHandlers({ historyService, bookmarkService, db, getMainWindow, faviconCache })`.
  `faviconCache` is optional.
- `register()` registers 23 channels and, once the app is ready, applies the
  stored dark mode:
  - `history:suggest(query, opts)`, `history:list(opts)`, `history:delete(id)`,
    `history:delete-url(url)`, `history:clear(opts)` -> HistoryService (`opts` default `{}`)
  - `bookmarks:get-tree`, `bookmarks:is-bookmarked(url)` -> BookmarkService
  - `bookmarks:add(payload)`, `bookmarks:add-folder(payload)`, `bookmarks:update(id, patch)`,
    `bookmarks:move(id, parentId, position)`, `bookmarks:remove(id)`,
    `bookmarks:toggle-url(url, title)` -> BookmarkService, then
    [BookmarkChangeNotifier](BookmarkChangeNotifier.md) broadcasts `bookmarks:changed`
  - `settings:get-start-page`, `settings:set-start-page(url)`,
    `settings:get-search-engine`, `settings:set-search-engine(id)`,
    `settings:list-search-engines`, `settings:search-url(query)`,
    `settings:get-dark-mode`, `settings:set-dark-mode(enabled)` ->
    [BrowserDataPreferences](BrowserDataPreferences.md)
  - `browser-data:get-favicon(host)`, `browser-data:get-favicons(hosts)` ->
    [FaviconLookup](FaviconLookup.md)

## Why replies are raw

The renderer has always read these replies as plain values (an array of
history rows, the stored URL). Handlers are registered through
`IpcEnvelope.raw` to make that visible; a throw rejects the invoke, as before.
