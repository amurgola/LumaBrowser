# FieldMenuKeys

`core/browser/tab-preload/FieldMenuKeys.js`

Keyboard for the autofill list while focus stays in the page's field, as in Chrome. ArrowDown / ArrowUp move through
the list, Enter fills the highlighted row instead of submitting the form, and Escape closes it. The list lives in the
browser chrome, so the keys go to main as `vault:field-key` `{ key }`. Main sends `vault:menu-state` `{ open, active }`,
so only an open list takes the arrows, and Enter only when a row is highlighted.

## Methods

- `new FieldMenuKeys(ipcRenderer, window)`, `install()` (http(s) pages), `onKeydown(event)`.
