# AcceleratorActions

`ui/shell/keyboard/AcceleratorActions.js`

Performs a shortcut action. For page-focused input (fromPage) main already did reload, back, forward, stop, print, zoom and devtools, so those only mirror state (zoom re-syncs).

## Methods

- `new AcceleratorActions(deps)`.
- `handle(action, tabId, { fromPage })`.
- `AcceleratorActions.cycle(ids, activeId, dir)`.

## Globals

Reads `window.tabAPI`.
