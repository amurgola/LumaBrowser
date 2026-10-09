# AttachmentParser

`core/llm-server/ui/js/markdown/AttachmentParser.js`

Splits the attachment blocks the chat composer splices onto the top of a user
message back out, so renderers (chat bubble, web client, share viewer) can show
each file as a card. View-time only: message content is never rewritten.

## Methods

- `AttachmentParser.parse(content)` returns `{ text, attachments }`, each
  attachment `{ kind, name, meta, lang, content }` with kind `file`, `image`,
  `binary` or `failed`. Recognised leading lines:
  - `[Attached: name · 12.3 KB]` followed by a fenced block (kind `file`; the
    block must close, otherwise the header stays visible text);
  - `[Attached image: name · 2 MB]`;
  - `[Attached: name · 1 MB <DASH> (binary, not embedded)]`;
  - `[Attachment failed: name <DASH> reason]`.
  The first other line ends the block; one blank separator line is dropped.
- `AttachmentParser.withText(content, text)` is the same message with its typed
  text replaced and the attachment block kept verbatim (an edited prompt keeps
  its files); with no attachments it is just `text`.
- `AttachmentParser.splitLabel(label)` turns `'name · 15.0 KB · truncated'` into
  `{ name, meta }`, dropping empty segments (the legacy `name · · 15.0 KB`).
- `AttachmentParser.DASH` is the em-dash character (U+2014) the composer writes
  into the binary and failed markers. It is part of the stored message format,
  not prose, so it is kept and built with `String.fromCharCode` (no em-dash
  appears in the source).

## Globals

None.
