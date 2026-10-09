# ConversationTitle

`core/llm-server/chat/router/ConversationTitle.js`

Conversation title text: the provisional title from the first user message and the cleanup of a model-written title.

## Methods

All static.

- `fromText(text)`: whitespace collapsed, cut at `MAX_CHARS` (60) with an ellipsis; `PLACEHOLDER` ("New chat") when empty.
- `firstUserText(messages)`: the first non-empty user content, or `''`.
- `clean(generated)`: quotes and whitespace stripped, first line, at most 60 characters; `''` when nothing is left.

## Why

Shared by the conversation creator and the title generator.
