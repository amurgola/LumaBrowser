# MessageTurnTranslator

`core/llm-server/server/anthropic/MessageTurnTranslator.js`

Translates one Anthropic Messages turn into the chat-completions messages it becomes.

## Methods

- `MessageTurnTranslator.translate(turn)` returns an array of messages (possibly empty):
  - a non-object turn, or content that is neither a string nor an array, gives `[]`;
  - any role other than `assistant` is treated as `user`; string content passes through;
  - assistant blocks: `text` joins into `content`, `thinking` joins into
    `reasoning_content`, `tool_use` becomes `tool_calls` (id kept or minted,
    `input` JSON-stringified, `{}` when absent). Content is `null` when the turn
    is only tool calls, `''` when empty;
  - user blocks: every `tool_result` becomes a `tool` message
    (`tool_call_id`, text from [AnthropicContent](AnthropicContent.md)`.toolResultText`),
    then the remaining `text`, `image` and `document` blocks form one user
    message: a plain string when all text, else a content-part array. Images
    that are neither base64 nor URL and unknown block types are dropped;
    documents become `[document attached]`.

## Why

OpenAI ordering requires tool results to directly follow the assistant's
`tool_calls`, so they are emitted before the rest of the user turn.
