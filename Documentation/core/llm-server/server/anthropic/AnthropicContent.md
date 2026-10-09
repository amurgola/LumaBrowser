# AnthropicContent

`core/llm-server/server/anthropic/AnthropicContent.js`

Converts Anthropic content shapes into the strings and OpenAI content parts
chat-completions carries.

## Methods

- `AnthropicContent.systemText(system)` returns a string system field as is,
  the text blocks of an array joined by a blank line, otherwise `''`.
- `AnthropicContent.toolResultText(content)` returns `''` for null, a string as
  is, a block array joined by newlines (text blocks as their text, images as
  `[image]`, other objects as JSON, primitives stringified), any other value as JSON.
- `AnthropicContent.imagePart(block)` returns an `image_url` part for a
  `base64` source (data URL, media type defaulting to `image/png`) or a `url`
  source, else `null`.
