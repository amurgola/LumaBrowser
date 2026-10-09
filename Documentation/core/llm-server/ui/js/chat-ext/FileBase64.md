# FileBase64

`core/llm-server/ui/js/chat-ext/FileBase64.js`

Reads a picked image `File` as `{ b64, mime }` (the shape image fields store).

## Methods

- `FileBase64.read(file)` resolves `{ b64, mime: file.type or image/png }`, or `null` on a read error.
