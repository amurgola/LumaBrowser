# PollingHint

`core/llm-server/ui/js/setup-ui/defaults/PollingHint.js`

Base class of the Defaults card's live caption hints: fetch a status, paint the hint, poll again while it is still on its way.

## Methods

- `refresh()`. Subclasses implement `_available()`, `_fetch()`, `paint(hint, status)` (returns the next poll delay or 0) and may override `_onStatus(status)`; the unimplemented hooks throw "<Class> must implement <hook>()".

## Globals

Reads `document` by id.
