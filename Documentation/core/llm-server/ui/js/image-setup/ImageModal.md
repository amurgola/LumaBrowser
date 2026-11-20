# ImageModal

`core/llm-server/ui/js/image-setup/ImageModal.js`

Base for the Image Setup's hand-rolled modals: an overlay closed by Escape, the surround or `[data-act="close"]`, with the footer error line. One modal may open another over itself (the LoRA dialog opens Browse CivitAI); Escape then closes only the top one (the last `.img-modal-wrap` in the document).

## Methods

- `show(innerHtml)`, `close()` (idempotent; drops the keydown listener), `isOpen()`, `setError(message)`, `ImageModal.resetButton(button, label)`.

## Globals

Adds a document keydown listener while open.

## Notes

Bug M28 (kept fixed): Escape closes both modals and the listener does not outlive them.
