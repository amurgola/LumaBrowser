# IdeContextFormatter

`core/llm-server/chat/IdeContextFormatter.js`

Formats editor context ("ask about this selection") as the block the model reads.

## Methods

- `IdeContextFormatter.render(items)` returns an `<ide_context>` block with a
  one-line preamble and one `<file path="..." lines="a-b" kind="selection">`
  element per usable item, or `''` when nothing is usable. Items are
  `{ path?, startLine?, endLine?, text?, kind? }`; an item needs a path or
  non-blank text. A file without text is self-closing; a one-line range has no
  dash; quotes in a path become `&quot;`. At most `MAX_ITEMS` (12) items; text is
  clipped against a shared `MAX_CHARS` (48 KB) budget with a `… (truncated)`
  marker, and rendering stops once the budget is spent.
- `IdeContextFormatter.appendToLastUserMessage(messages, items)` returns a copy
  of `messages` with the block appended (after a blank line) to the last user
  message. Returns the input untouched when there is no block, no array or no
  user message. Never mutates the input.

## Why

One formatter for every editor that can attach context: the IDE plugins over
the terminal bridge (code mode's terminal) and the in-app Code surface over chat2
(the IPC handlers). The chat UI caps its chips at the same 12.

The block rides only the model-facing messages of the turn it was sent with; the
stored user message stays bare text, so a transcript never fills up with pasted
files. The caps stop a stray "add folder" from blowing the context window.
