# OverflowMenu

`extensions/ui-kit/ui/OverflowMenu.js`

A `.luma-menu` dropdown anchored under a button, for extension rows' overflow
actions. One menu is open at a time.

## Methods

- `OverflowMenu.open(anchor, items)` closes any open menu, builds the new one
  (`items`: `{ label, onClick?, danger?, disabled?, sep? }`; `sep` draws a
  divider), right-aligns it under the anchor (flipped above when it would run off
  the bottom, kept 8 px from the edges), focuses the first enabled item and
  returns the element. Picking an item closes the menu, then runs `onClick`.
- `OverflowMenu.close()` removes the menu and its listeners. It also closes on a
  press outside the menu and anchor, Escape, or a window resize.

## Globals

Reads `document`, `window.innerHeight`; listens on document and window while open.
