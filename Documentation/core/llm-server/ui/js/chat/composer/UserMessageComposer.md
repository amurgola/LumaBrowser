# UserMessageComposer

`core/llm-server/ui/js/chat/composer/UserMessageComposer.js`

Splices staged attachments into the user message the model sees, in the format
[AttachmentParser](../../markdown/AttachmentParser.md) reads back: text and PDF
text as `[Attached: name · size]` plus a fenced block (an open tab's page as
`[Attached: title · host · size]`, its body starting with `URL: ...`), images as a short
`[Attached image: ...]` marker (their bytes travel separately as real image
parts; inlining them flooded the context), a marked area as
`[Marked area on name <DASH> note]` right after its image marker (or on its
own for an image already in the conversation; the mask travels separately),
and failures and binaries with the wire-format dash (`AttachmentParser.DASH`).

## Methods

- `UserMessageComposer.compose(userText, attachments)`.
- `UserMessageComposer.images(attachments)`: `{ name, mime, base64, region? }` for
  readable images with bytes (`region`: `{ mask, note, coverage, width, height }`).
- `UserMessageComposer.regions(attachments)`: the `kind: 'region'` entries for
  the wire, `{ kind, artifactId, title, mask, note, coverage, width, height }`.
- `UserMessageComposer.markedAreas(attachments)`: what the sent turn shows,
  `{ artifactId?, title, note, coverage, preview }` per marked area.
