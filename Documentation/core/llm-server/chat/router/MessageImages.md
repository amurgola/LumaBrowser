# MessageImages

`core/llm-server/chat/router/MessageImages.js`

Puts a turn's attached images in front of the model: OpenAI `image_url` parts on the newest user turn, or a blunt note that the loaded model cannot see.

## Methods

All static; none mutates its input.

- `inject(messages, images)`: the newest user turn becomes `[{ type: 'text' }?, { type: 'image_url', image_url: { url: 'data:<mime>;base64,...' } }...]`; the mime defaults to `image/png`; the text part is omitted when empty.
- `noteNotVisible(messages, count)`: appends the "[System note: N image(s) ... cannot see images ...]" text to the newest user turn.
- `imagesOf(attachments)`: only `{ kind: 'image', base64 }` entries; `[]` for a non-array.

## Why

Inlining base64 as markdown flooded the context; without the no-vision note a text model hallucinates the picture or burns tool calls trying to open it.
