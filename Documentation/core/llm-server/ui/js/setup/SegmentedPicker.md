# SegmentedPicker

`core/llm-server/ui/js/setup/SegmentedPicker.js`

A segmented pill picker backed by a hidden input, for short closed sets (2 to 6
values). The hidden input keeps the `.value` plus `change` contract the Setup
save handlers use for their selects.

## Methods

- `SegmentedPicker.html(id, options, current)`: a `.luma-segmented.defaults-seg`
  radiogroup (`data-seg-for="<id>"`) of `[data-seg-value]` buttons (`title`
  optional) plus `<input type="hidden" id="<id>">`. Every value is escaped.
- `SegmentedPicker.install(document)`: one delegated click handler. A click on
  an enabled pill whose value differs sets the input, moves `active` and
  `aria-checked`, and dispatches one `change` on the input. Idempotent per
  document. Call it from every page entry that renders Setup cards.

## Globals

Listens on the given document.
