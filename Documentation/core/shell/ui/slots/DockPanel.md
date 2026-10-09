# DockPanel

`core/shell/ui/slots/DockPanel.js` (ES module)

Show and hide rules for the toggle slots (`right-panel`, `bottom-bar`): each wrapper toggles alone and the shared container shows while any wrapper does.

## Methods

- `DockPanel.isToggleSlot(slotName)`; `DockPanel.HIDDEN` = `'ext-hidden'`.
- `DockPanel.toggle(container, extensionId, button)`: flips the wrapper, then
  the container, and toggles `is-open` on the clicked button.
- `DockPanel.collapseIfEmpty(container)`: hides the container when no wrapper is
  visible (disabling an extension whose panel was open no longer leaves an empty
  aside).

## Globals

None.
