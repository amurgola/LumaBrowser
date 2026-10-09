# AnthropicIds

`core/llm-server/server/anthropic/AnthropicIds.js`

Mints Anthropic-style ids.

## Methods

- `AnthropicIds.messageId(upstreamId = null)` returns `msg_` plus the upstream
  chat-completions id without its `chatcmpl-` prefix, or 24 random hex
  characters when there is none.
- `AnthropicIds.toolUseId()` returns `toolu_` plus 24 random hex characters.

## Why

Reusing the upstream id lets a Messages reply be traced back to the
llama-server request in its logs.
