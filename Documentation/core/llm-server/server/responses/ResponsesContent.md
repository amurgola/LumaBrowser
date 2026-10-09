# ResponsesContent

`core/llm-server/server/responses/ResponsesContent.js`

Converts Responses content shapes into chat-completions strings and parts.

## Methods

- `text(content, separator)` joins every text-like part (`input_text`,
  `output_text`, `text`, `refusal`, `summary_text`, `reasoning_text`, bare strings).
- `userContent(content)` a string when all text (joined by newline), else chat
  parts: `input_image` becomes `image_url` (a `file_id` image becomes `[image]`),
  `input_file` becomes `[file attached: name]`.
- `toolOutput(output)` a string as is, parts joined by newline (`[image]` for
  images), `{ content }` its content, anything else JSON.

## Why

Chat `tool` messages carry only text on llama-server, and stored files have no
local meaning.
