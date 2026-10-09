# BookmarkTree

`ui/shell/bookmarks/BookmarkTree.js`

The renderer copy of the bookmark tree, reloaded from main; views subscribe with onChange. Holds the reorder that suppresses main's change events mid-way.

## Methods

- `nodes`, `suppressRefresh`, `onChange(fn)`, `reload()`, `findByUrl(url)`, `findById(id)`, `folders()`, `urls()`, `reorderTopLevel(draggedId, beforeId)`.
- `BookmarkTree.find(nodes, match)`.

## Globals

Reads `window.bookmarksAPI`.
