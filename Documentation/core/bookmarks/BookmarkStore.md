# BookmarkStore

`core/bookmarks/BookmarkStore.js`

Typed CRUD over the `bookmarks` table, declared by SettingsDatabase. Uses that
database's better-sqlite3 handle and never closes it.

The table is one self-referencing tree: `parent_id` NULL is the top level (the
bookmarks bar); `type` is `folder` (url NULL) or `bookmark`; `position` orders
siblings; `open_on_startup` marks links opened in a tab on launch.
Nodes come back as `{ id, parentId, type, title, url, position, openOnStartup, createdAt }`.

## Methods

- `new BookmarkStore(settingsDb)`; throws "BookmarkStore requires a SettingsDatabase
  with an open handle" when `settingsDb.db` is missing.
- `create({ id?, type='bookmark', title?, url?, parentId=null, position?, openOnStartup=false })`
  inserts and returns the node. Ids are `bm_...` / `bmf_...` (RecordId). Without a
  position the node goes to the end of its parent. Folders never keep a url.
- `getById(id)` node or null.
- `children(parentId=null)` direct children ordered by position, then creation.
- `all()` every node, flat, in the same order.
- `tree()` top-level nodes; each folder carries a `children` array, recursively.
- `findByUrl(url)` first bookmark (anywhere) with that url, or null.
- `isBookmarked(url)` boolean.
- `update(id, { title?, url?, parentId?, position?, openOnStartup? })` partial
  update; returns the node, or null for an unknown id. A folder's url is never
  set. Changing `parentId` without `position` appends to the new parent.
- `remove(id)` deletes the node and, for folders, all descendants in one
  transaction; returns the number of rows deleted (0 for an unknown id).
- `startupBookmarks()` bookmarks flagged open-on-startup, in bar order.

## Shared base

HistoryStore is the same kind of store. What they share (borrowing the
SettingsDatabase handle, minting prefixed ids) already lives in
`core/database/StoreHandle` and `core/database/RecordId`; the rest is
table-specific, so there is no common base class.
