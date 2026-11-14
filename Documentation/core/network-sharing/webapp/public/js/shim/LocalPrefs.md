# LocalPrefs

`core/network-sharing/webapp/public/js/shim/LocalPrefs.js`

Per-device chat preferences in localStorage: `luma.web.sidebar` (`'1'` collapsed)
and `luma.web.model`.

Until the person opens or closes the chat list on this device (nothing stored),
it starts closed on a phone sized screen and open on a wider one. On a phone an
open list is a drawer over the chat (`web-overrides.css`), so starting open put
it on top of the composer on the first screen after pairing. The breakpoint is
`LocalPrefs.NARROW_QUERY`, the same `(max-width: 760px)` as the stylesheet's
phone layer. A stored choice always wins.

## Methods

- `new LocalPrefs(storage, win?)`: `win` supplies `matchMedia`; without it the
  screen counts as wide.
- `getSidebarCollapsed()`: a bare boolean (the desktop contract; legacy returned
  `{ success, collapsed }`, see [LlmApiShim](LlmApiShim.md)).
- `setSidebarCollapsed(collapsed)`, `setLastModelRef(ref)`: `{ success: true }`.
