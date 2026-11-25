# ToolReply

`extensions/android/tools/ToolReply.js`

Builds the MCP tool-result envelope the `android_*` tools answer with, in the shape core's own tools use. The
add-on has its own so that it requires nothing from core by a relative path, which would not resolve once it is
installed into userData.

## Methods

- `ToolReply.done(data)`: `{ success: true, data }` as JSON text, with the same object as `structuredContent`.
- `ToolReply.error(message)`: `{ success: false, error }` as JSON text and `isError: true`.
- `ToolReply.lines(text)`: plain text (a screen reading).
- `ToolReply.image(png, caption)`: an image part (raw base64, `image/png`) and a line of text.
