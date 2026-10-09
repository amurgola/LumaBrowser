# FileTree

`core/llm-server/ui/js/code/FileTree.js`

The lazy file tree: folders are listed when first expanded; renders the
expanded part with the active file highlighted.

## Methods

- `listDir(dir)`, `render(activePath)`, `showMessage(html)`, `toggle(dir, activePath)`,
  `reveal(dir)` (expand every folder down to it), `refreshListed()` (the root
  and every expanded folder), `forget(path)`, `clear()`.
