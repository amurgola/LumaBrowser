# StreamedOutputItem

`core/llm-server/server/responses/StreamedOutputItem.js`

Base class for one output item while it streams. Subclasses:
[StreamedTextItem](StreamedTextItem.md), [StreamedToolCallItem](StreamedToolCallItem.md).

## Methods

- `new StreamedOutputItem({ outputIndex, emit, id })`.
- `open()` emits `response.output_item.added` with the in-progress item, then `_opened()`.
- `append(fragment)` (abstract).
- `close()` runs `_closing()`, emits `response.output_item.done` and returns the finished item.
- `_item(status)` (abstract); hooks `_opened()`, `_closing()`; `_where()` the
  `{ item_id, output_index }` every per-item event carries.

## Why

Every item kind follows the same added, deltas, done lifecycle.
