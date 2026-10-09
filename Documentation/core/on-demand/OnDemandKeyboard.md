# OnDemandKeyboard

`core/on-demand/OnDemandKeyboard.js`

Keyboard routing for the focused On Demand window.

## Methods

- `new OnDemandKeyboard({ tabViewManager, lookup, isExpanded, collapse })`.
- `handle(event, input)` (from `before-input-event`): ignores anything but
  `keyDown`. Escape with the panel open prevents default and calls `collapse()`.
  Otherwise a browser shortcut ([Accelerators](../browser/Accelerators.md)`.match`,
  with the tab's `loading` flag) prevents default, is performed in main through
  `tabViewManager.performAccelerator(entry, action)` when it is
  `MAIN_HANDLED`, and is forwarded to the shell as
  `tab-view:accelerator { action, tabId }`. Errors are swallowed.

## Why

The panel keeps keyboard focus for its text box, so without forwarding,
browser shortcuts (reload, new tab, find) would stop working whenever it is open.
