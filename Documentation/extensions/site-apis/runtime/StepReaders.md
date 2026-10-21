# StepReaders

`extensions/site-apis/runtime/StepReaders.js`

The producer steps that read the page, each through the executor's targeted resolution so a failed selector is
healed; for these kinds the resolution is [ReaderResolver](ReaderResolver.md) (text, row-group and table matching),
not the interactive-element fallback.

## Methods

- `new StepReaders({ browser, tabId, targeted })`: `targeted(step, index, action, primary)` is
  `StepExecutor._targeted`.
- `read(step, index)` -> `{ value, via }`: runs `StepReaders.readScript(selector, attribute)` through
  `browser.executeJs`; a form field answers its `value`, anything else its `innerText`; `attribute` reads that
  attribute; `all: true` answers every match as an array, else the first match.
- `extract(step, index)` -> `{ rows, via, note? }`: `browser.extractData({ baseSelector, childSelectors,
  preferTableStructure })`. Zero rows with a description count as a failed selector so the resolver tries the
  description; when recovery finds nothing either, the answer is an empty list with a note (an empty page is a
  valid answer). Rows whose every field is null (`nullFields` covers all child selectors) are `step_failed`
  with `detail.nullFields`. `maxRows` caps the list.
- `table(step, index)` -> `{ rows, via }`: `browser.getTable({ selector, rowSelector, cellSelector })`; each row
  becomes an object keyed by the header texts, a blank header becomes `colN`.
- `StepReaders.merge(current, as, value)`: `as` of `$` or none replaces the current result; a name merges into an
  object (a non-object current result is replaced by a fresh object).

## Decisions

- `read` uses its own in-page script rather than `getElement` so one call serves text, attributes and `all`.
- The zero-row signal travels as `detail.zeroRows` on the step fault, which `extract` turns into the empty list.
