# DomQuery

`extensions/cdp-driver/domains/DomQuery.js`

DOM-domain helpers over the debugger proxy.

## Methods

- `DomQuery.nodeId(dbg, tabId, selector)`: `DOM.enable`, `DOM.getDocument` (depth 0),
  `DOM.querySelector`; the node id or 0. Errors propagate.
- `DomQuery.exists(dbg, tabId, selector)`: boolean, never throws.
- `DomQuery.centerOf(boxModelResult)` -> `{ x, y }` midway between the content box's
  top-left and bottom-right corners, or null.
