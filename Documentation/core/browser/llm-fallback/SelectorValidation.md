# SelectorValidation

`core/browser/llm-fallback/SelectorValidation.js`

Checks a candidate selector against the live DOM.

## Methods

- `SelectorValidation.script(selector)`: in-page source returning
  `{ ok, count, visible }` (visible = non-zero bounding box), or
  `{ ok: false, count: 0, error }` for an invalid selector.
- `SelectorValidation.verdict(probe)`: `{ ok, count, error }` where ok is true
  only for exactly one match or exactly one visible match.

The count is fed back to the model on a miss ("matched 0 elements", "matched 3
elements (ambiguous)").
