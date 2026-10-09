# StreamedTextItem

`core/llm-server/server/responses/StreamedTextItem.js`

Base class for a streamed item with one text content part. Subclasses:
[StreamedMessageItem](StreamedMessageItem.md), [StreamedReasoningItem](StreamedReasoningItem.md).

## Methods

- `open` adds `response.content_part.added` (empty part).
- `append(fragment)` accumulates `text` and emits `DELTA_EVENT` with
  `content_index: 0` and `delta`.
- `close` adds `DONE_EVENT` (full `text`) and `response.content_part.done` before the item is done.
- `_part(text)` (abstract) the content part.
