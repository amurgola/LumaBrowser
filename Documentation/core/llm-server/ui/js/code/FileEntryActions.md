# FileEntryActions

`core/llm-server/ui/js/code/FileEntryActions.js`

Create, rename and delete in the folder, and the tree's context menu (New
file, New folder, Add to chat for files, Rename, Delete). Rename carries an
open file's unsaved text to the new path; delete closes every open file under
it.

## Methods

- `create(kind, dir?)`, `rename(path)`, `remove(path, isDir)`, `openMenu(event)`; field `menu`.
