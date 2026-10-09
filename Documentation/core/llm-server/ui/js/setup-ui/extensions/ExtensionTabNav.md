# ExtensionTabNav

`core/llm-server/ui/js/setup-ui/extensions/ExtensionTabNav.js`

The DOM half of extension Setup tabs: one nav button under an "Extensions" group label in `#pageNav` and one hidden pane in `#setupRoot` per tab.

## Methods

- `hosts()`: `{ nav, root }` or null; `has(id)`, `ids()`, `pane(id)`.
- `add(hosts, tab)`: button `data-view="ext:<id>"` (class `pagenav-ext`, label as text, an inline `<svg>` icon or the puzzle piece, title = description or label) and pane `#extPane-<id>` showing "Loading…".
- `remove(nav, id)`: returns true when the removed button was active; the group label goes with the last tab.
- `ExtensionTabNav.failedHtml(message)`: the escaped failure callout.

## Globals

Reads `document`.
