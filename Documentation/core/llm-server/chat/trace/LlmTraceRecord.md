# LlmTraceRecord

`core/llm-server/chat/trace/LlmTraceRecord.js`

Turns one [LlmTrace](../LlmTrace.md) record into the line that is persisted.

## Methods

- `LlmTraceRecord.toLine(record)`: JSON plus newline. `requestBody` is
  sanitised and, if its JSON is over `MAX_BODY_CHARS` (2 MB), replaced by
  `{ truncated: true, chars, preview }`. `response.text` and
  `response.reasoning` are capped at `MAX_TEXT_CHARS` (200 KB). Throws if the
  record cannot be serialised (the writer catches it).
- `LlmTraceRecord.sanitizeBody(body)`: a copy where `image_url: { url }`
  becomes `{ url: '<image N chars>' }`, `base64` / `imageBase64` strings and any
  string starting `data:image` become `<image N chars>`, other strings are
  capped, and cycles or nesting past 12 levels become `[circular]`.
- `LlmTraceRecord.cap(text, max)`: `text` or its first `max` chars plus
  `... [N more chars]`; nullish passes through.
