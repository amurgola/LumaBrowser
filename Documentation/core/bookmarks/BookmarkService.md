# BookmarkService

`core/bookmarks/BookmarkService.js`

The bookmarks API the IPC layer and UI use. It validates input, fills default
titles and owns the public vocabulary over [BookmarkStore](BookmarkStore.md),
which it creates on the SettingsDatabase handle it is given.

## Methods

- `new BookmarkService(settingsDb)`; throws as BookmarkStore does when the
  handle is not open.
- `getTree()` top-level nodes, folders carrying `children` recursively.
- `getChildren(parentId = null)` direct children; null is the bookmarks bar.
- `addBookmark({ url, title, parentId = null, openOnStartup = false })` trims the
  url and title; the title falls back to the url. Throws `Bookmark url is required`
  for a blank url.
- `addFolder({ title, parentId = null })` title defaults to `New folder`.
- `update(id, patch)` any of title, url, parentId, position, openOnStartup.
  Throws `Bookmark id is required` without an id.
- `move(id, parentId, position)` a falsy parentId moves to the bar.
- `toggleStartup(id, openOnStartup)`.
- `remove(id)` folders recurse; returns rows deleted.
- `isBookmarked(url)` false for a blank url.
- `toggleUrl(url, title)` removes the url's bookmark if present
  (`{ bookmarked: false }`), otherwise adds it to the bar
  (`{ bookmarked: true, bookmark }`). A blank url returns `{ bookmarked: false }`.
- `getStartupBookmarks()` bookmarks to open in tabs on launch.
