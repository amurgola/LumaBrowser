# ConversationTitle

`core/llm-server/chat/router/ConversationTitle.js`

Conversation title text: the provisional title from the first user message and the cleanup of a model-written title.

## Methods

All static.

- `fromText(text)`: whitespace collapsed, cut at `MAX_CHARS` (60) with an ellipsis; `PLACEHOLDER` ("New chat") when empty.
- `firstUserText(messages)`: the first non-empty user content, or `''`.
- `clean(generated)`: the first line that has words, with quotes, whitespace and the markdown a model wraps a title in stripped (a leading `#`, `>`, `-` or `*`, a "Title:" prefix, bold, italic and code marks; an underscore inside a word stays), at most 60 characters; `''` when nothing is left. A roleplay conversation was listed as "# Hungry Cat Seeks Refuge".

## Why

Shared by the conversation creator and the title generator.
