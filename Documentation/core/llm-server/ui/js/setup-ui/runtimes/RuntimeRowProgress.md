# RuntimeRowProgress

`core/llm-server/ui/js/setup-ui/runtimes/RuntimeRowProgress.js`

Live state of a runtime row while it installs: the progress strip, disabled buttons and the translation of streamed installer events.

## Methods

- `row(id)` (CSS.escape, else a fallback that escapes every non-word character), `set(id, opts)`, `setButtonsDisabled(id, disabled)`, `applyEvent({ id, type, payload })`, `progressFor(type, payload)`.

## Globals

Reads `document`, `CSS.escape`.
