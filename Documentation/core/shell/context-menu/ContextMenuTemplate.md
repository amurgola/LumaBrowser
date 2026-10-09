# ContextMenuTemplate

`core/shell/context-menu/ContextMenuTemplate.js`

Builds the Electron menu template for one right click, Chrome style.

## Methods

- `new ContextMenuTemplate({ webContents, params, tab, db })`; `tab` is a
  [MenuTab](MenuTab.md), `params` the Electron context-menu params (optionally
  with `recoveredSrcURL` from [ImageSrcRecovery](ImageSrcRecovery.md)).
- `build()` returns the item array, possibly empty.
- `ContextMenuTemplate.cleanSeparators(items)` drops leading, doubled and
  trailing separators.
- `ContextMenuTemplate.truncate(text, max = 32)` collapses whitespace and cuts
  with `...` for the search label.

## Blocks, in order

- Navigation (Back, Forward, Reload): non-internal tab pages, only when the
  target is not a link, image, input or selection.
- Link: Open link in new tab (tab pages), Open link in default browser, Copy link address.
- Image: Open image in new tab (tab pages with a src), Copy image (always, a
  bitmap copy at the hit point), Copy image address (src only), Save image as
  (src or recovered src). A recovered multi-megabyte data: URL is fine to
  download but not to navigate to or paste, so the URL-only items stay hidden.
- Editing: inputs get undo/redo/cut/copy/paste/pasteAndMatchStyle/delete/selectAll
  roles with their edit flags; a selection gets copy (and selectAll); a plain
  area gets selectAll when there is anything to select.
- Search `<engine>` for "<selection>": tab pages with a selection, opens a
  foreground tab via [SearchEngines](../../browser/SearchEngines.md).
- Inspect element: non-internal tab pages; focuses devtools if open.
