# MessageText

`core/llm-server/chat/compaction/MessageText.js`

Flattens a chat message's content to plain text for measuring and matching.

## Methods

- `MessageText.of(message)`: a string content as is; OpenAI multimodal parts
  joined by spaces (strings as is, `text` parts by their text, `image_url`
  parts as `[image]`, anything else empty); `''` for anything else.
