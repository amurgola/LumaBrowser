# StatusLine

`core/llm-server/ui/js/setup-ui/StatusLine.js`

Sets an inline status span's state class and text. Every Setup action that reports next to its button uses it.

## Methods

- `StatusLine.for(element, baseClass)` returns `(cls, text) => void`; it sets `className = baseClass + (cls ? " " + cls : "")` and `textContent`. A missing element makes it a no-op.

## Globals

None.
