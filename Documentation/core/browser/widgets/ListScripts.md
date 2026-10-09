# ListScripts

`core/browser/widgets/ListScripts.js`

In-page steps of `collect_list`, each wrapped by [WidgetScript](WidgetScript.md).

## Methods

- `collectListStepScript({ itemSelector, childSelectors })`: every rendered
  item as `{ key, order, fields }`. Fields come from
  [RowExtract](../extraction/RowExtract.md)'s `extractRow` when child selectors
  are given, else `{ text (500 chars), href }`. The key is the list's own row
  identity (`data-key`, `data-id`, `data-index`, `aria-rowindex`, ...) when
  present, because it survives a virtualized list recycling DOM nodes; else
  the link plus a text hash. Also reports `total`, `scrollTop`, `atBottom`,
  `endVisible`, `container`.
- `scrollListScript({ itemSelector })`: scrolls the list's container (or the
  page) by most of a viewport; `{ moved, atBottom, container }`.
- `findLoadMoreScript({ itemSelector })`: marks THIS list's "Load more" /
  "Show more" control: inside the items' wrapper, after the first item, not
  inside an item, enabled, visible, and not a navigating link.
- `clickLoadMoreScript()`: page-world click on the marked control.
- `SCROLL_ROOT_SRC`: shared helpers `__scrollRoot`, `__rootState` (with
  `endVisible`: until the last item's bottom is on screen, "no new items" does
  not mean the list is done) and `__hash`.
