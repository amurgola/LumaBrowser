# ImageModal

`core/llm-server/ui/js/image-setup/ImageModal.js`

Base for the Image Setup's hand-rolled modals: one overlay at a time, closed by Escape, the surround or `[data-act="close"]`, with the footer error line.

## Methods

- `show(innerHtml)`, `close()` (idempotent; drops the keydown listener), `isOpen()`, `setError(message)`, `ImageModal.resetButton(button, label)`.

## Globals

Adds a document keydown listener while open.

## Notes

Bug M28 (kept fixed): Escape closes both modals and the listener does not outlive them.
