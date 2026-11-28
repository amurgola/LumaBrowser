# MessageImages

`core/llm-server/chat/router/MessageImages.js`

Puts a turn's attached images in front of the model: OpenAI `image_url` parts on the newest user turn, or a blunt note that the loaded model cannot see.

## Methods

All static; none mutates its input.

- `inject(messages, images)`: the newest user turn becomes `[{ type: 'text' }?, { type: 'image_url', image_url: { url: 'data:<mime>;base64,...' } }...]`; the mime defaults to `image/png`; the text part is omitted when empty.
- `lift(messages)`: the inverse of `inject`, returning `{ messages, images: [{ mime, base64 }] }`. When the newest user turn's content is an array of text parts and inline `data:<mime>;base64,` image parts only, that turn becomes its text (parts joined with a newline) and the images come back out. Any other content (a string, a remote image URL, an unknown part type) returns the same `messages` array and `[]`. Only the newest user turn is read.
- `noteNotVisible(messages, count)`: appends the "[System note: N image(s) ... cannot see images ...]" text to the newest user turn.
- `imagesOf(attachments)`: only `{ kind: 'image', base64 }` entries; `[]` for a non-array.

## Why

Inlining base64 as markdown flooded the context; without the no-vision note a text model hallucinates the picture or burns tool calls trying to open it.

`lift` exists for the receiving end of Network Sharing. A paired desktop client injects a turn's images before the request leaves it, so the host got a turn with no images beside it: its vision projector is loaded only for a turn that has images, so the model server ran without image input and refused the request. [ProxyTurns](ProxyTurns.md) lifts them back out and the host's own path decides (load vision and inject, or the no-vision note).
