# UserMessageComposer

`core/llm-server/ui/js/chat/composer/UserMessageComposer.js`

Splices staged attachments into the user message the model sees, in the format
[AttachmentParser](../../markdown/AttachmentParser.md) reads back: text and PDF
text as `[Attached: name · size]` plus a fenced block (an open tab's page as
`[Attached: title · host · size]`, its body starting with `URL: ...`), images as a short
`[Attached image: ...]` marker (their bytes travel separately as real image
parts; inlining them flooded the context), and failures and binaries with the
wire-format dash (`AttachmentParser.DASH`).

## Methods

- `UserMessageComposer.compose(userText, attachments)`.
- `UserMessageComposer.images(attachments)`: `{ name, mime, base64 }` for readable
  images with bytes.
