# ToolbarButton

`core/shell/ui/slots/ToolbarButton.js` (ES module)

Builds the button an extension gets in a toolbar slot: an SVG sprite icon (`#i-<icon>`) when named, else its label.

## Methods

- `ToolbarButton.create(container, extensionId, { label?, tooltip?, icon?, onClick? })`
  appends and returns `<button data-extension-id title aria-label class="toolbar-btn[ icon-btn]">`.
- `ToolbarButton.remove(container, extensionId)` removes that extension's button.

## Globals

None.
