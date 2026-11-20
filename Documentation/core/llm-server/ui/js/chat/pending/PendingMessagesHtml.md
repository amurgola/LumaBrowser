# PendingMessagesHtml

`core/llm-server/ui/js/chat/pending/PendingMessagesHtml.js`

Markup of the queued-messages strip ([PendingMessages](PendingMessages.md)).

## Methods

- `PendingMessagesHtml.build(items, { held, canSend })`: '' with no items, else a head
  line (`Queued (2)`, then `WAITING` or, on hold, `HELD` with a "Send next" button,
  `data-pending-send`, disabled while a reply is being written) and one row per message.
- `row(item)`: the message on one line, its attachment count, Edit
  (`data-pending-edit`) and Remove (`data-pending-remove`).
- `label(item)`: the text with whitespace flattened; "Attachments only" for a message
  without text.
- `extras(item)`: `2 attachments`, `1 attachment` or '' (staged files, images and
  editor chips together).

All text is escaped with HtmlEscaper.
